import { auth } from "@/lib/auth";
import {
  getDuelLanguage,
  MAX_DUEL_CODE_LENGTH,
  MAX_DUEL_STDIN_LENGTH,
  PISTON_EXECUTE_URL,
} from "@/lib/piston";

type ExecuteRequestBody = {
  languageId?: string;
  code?: string;
  stdin?: string;
};

type PistonRunResult = {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
};

type PistonResponse = {
  run?: PistonRunResult;
  compile?: PistonRunResult;
  message?: string;
};

/** Runs duel code server-side via the public Piston API so users get a real editor + console without us hosting a sandbox. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: ExecuteRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { languageId, code, stdin = "" } = body;

  if (typeof languageId !== "string" || typeof code !== "string") {
    return Response.json({ error: "languageId and code are required" }, { status: 400 });
  }
  if (code.length > MAX_DUEL_CODE_LENGTH) {
    return Response.json({ error: "Code is too long" }, { status: 400 });
  }
  if (typeof stdin !== "string" || stdin.length > MAX_DUEL_STDIN_LENGTH) {
    return Response.json({ error: "stdin is too long" }, { status: 400 });
  }

  const language = getDuelLanguage(languageId);
  if (!language) {
    return Response.json({ error: "Unsupported language" }, { status: 400 });
  }

  let pistonResponse: Response;
  try {
    pistonResponse = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: language.pistonLanguage,
        version: language.pistonVersion,
        files: [{ content: code }],
        stdin,
      }),
    });
  } catch {
    return Response.json({ error: "Could not reach the code execution service" }, { status: 502 });
  }

  if (!pistonResponse.ok) {
    return Response.json({ error: "The code execution service rejected the request" }, { status: 502 });
  }

  const result: PistonResponse = await pistonResponse.json();
  if (!result.run) {
    return Response.json({ error: result.message ?? "Execution failed" }, { status: 502 });
  }

  return Response.json({
    stdout: result.run.stdout,
    stderr: result.run.stderr,
    exitCode: result.run.code,
    compile: result.compile
      ? { stdout: result.compile.stdout, stderr: result.compile.stderr, exitCode: result.compile.code }
      : null,
  });
}
