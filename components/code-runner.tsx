"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, ChevronDown, TerminalSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { DUEL_LANGUAGES, getDuelLanguage } from "@/lib/piston";

type ExecuteResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  compile: { stdout: string; stderr: string; exitCode: number | null } | null;
};

function storageKey(roomCode: string, suffix: string) {
  return `algowise:duel:${roomCode}:${suffix}`;
}

/** Reads any in-progress code for this room from localStorage (SSR-safe: no-ops server-side). */
function getInitialDuelState(roomCode: string) {
  if (typeof window === "undefined") {
    return { languageId: "javascript", code: getDuelLanguage("javascript")!.defaultCode };
  }
  const storedLanguageId = localStorage.getItem(storageKey(roomCode, "language"));
  const languageId =
    storedLanguageId && getDuelLanguage(storedLanguageId) ? storedLanguageId : "javascript";
  const storedCode = localStorage.getItem(storageKey(roomCode, `code:${languageId}`));
  return { languageId, code: storedCode ?? getDuelLanguage(languageId)!.defaultCode };
}

export function CodeRunner({ roomCode }: { roomCode: string }) {
  const { theme } = useTheme();
  const [initial] = useState(() => getInitialDuelState(roomCode));
  const [languageId, setLanguageId] = useState(initial.languageId);
  const [code, setCode] = useState(initial.code);
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey(roomCode, "language"), languageId);
  }, [roomCode, languageId]);

  useEffect(() => {
    localStorage.setItem(storageKey(roomCode, `code:${languageId}`), code);
  }, [roomCode, languageId, code]);

  function handleLanguageChange(nextId: string) {
    const stored = localStorage.getItem(storageKey(roomCode, `code:${nextId}`));
    setLanguageId(nextId);
    setCode(stored ?? getDuelLanguage(nextId)!.defaultCode);
    setResult(null);
    setError(null);
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageId, code, stdin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Execution failed");
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the code execution service");
    } finally {
      setRunning(false);
    }
  }

  const language = getDuelLanguage(languageId)!;
  const compileFailed = !!result?.compile && result.compile.exitCode !== 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <TerminalSquare className="size-4" />
          Code Editor
        </CardTitle>
        <div className="relative">
          <select
            value={languageId}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="h-8 appearance-none rounded-md border border-input bg-transparent pl-2.5 pr-7 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {DUEL_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <Editor
            height="320px"
            language={language.monacoLanguage}
            theme={theme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleRun} disabled={running}>
            {running ? <Loader2 className="animate-spin" /> : <Play />}
            Run
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowStdin((v) => !v)}>
            {showStdin ? "Hide stdin" : "Add stdin"}
          </Button>
        </div>

        {showStdin && (
          <Textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Input passed to stdin, if your program reads it"
            className="font-mono text-sm"
          />
        )}

        {(result || error) && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
            {error && <p className="text-destructive">{error}</p>}
            {result && (
              <>
                {compileFailed && (
                  <pre className="whitespace-pre-wrap text-destructive">
                    {result.compile?.stderr || result.compile?.stdout}
                  </pre>
                )}
                {!compileFailed && (
                  <>
                    {result.stdout && (
                      <pre className="whitespace-pre-wrap text-foreground">{result.stdout}</pre>
                    )}
                    {result.stderr && (
                      <pre className="whitespace-pre-wrap text-destructive">{result.stderr}</pre>
                    )}
                    {!result.stdout && !result.stderr && (
                      <p className="text-muted-foreground">(no output)</p>
                    )}
                  </>
                )}
                <p
                  className={cn(
                    "mt-2 text-xs",
                    result.exitCode === 0 ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  Exit code: {result.exitCode ?? "—"}
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
