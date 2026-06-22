"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { searchProblems, addProblemToList } from "@/actions/list-actions";

type SearchResult = { id: string; title: string; difficulty: string };

export function AddToListSearch({
  listId,
  existingProblemIds,
}: {
  listId: string;
  existingProblemIds: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const existing = new Set(existingProblemIds);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const matches = await searchProblems(trimmed);
      setResults(matches);
      setIsSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleAdd(problemId: string) {
    setAddingId(problemId);
    startTransition(async () => {
      await addProblemToList(listId, problemId);
      setAddingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search problems by title to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {query.trim() && (
        <div className="overflow-hidden rounded-xl border border-border">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No problems found for &quot;{query}&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map((p) => {
                const alreadyAdded = existing.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="truncate font-medium">{p.title}</span>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyAdded ? "ghost" : "outline"}
                      disabled={alreadyAdded || addingId === p.id}
                      onClick={() => handleAdd(p.id)}
                    >
                      {addingId === p.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : alreadyAdded ? (
                        "Added"
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          Add
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
