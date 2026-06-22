"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Home, Star } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export type PaletteCompany = {
  slug: string;
  name: string;
  problemCount: number;
};

export function CommandPalette({ companies }: { companies: PaletteCompany[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function openPalette() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("open-command-palette", openPalette);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Jump to" description="Search companies or navigate">
      <CommandInput placeholder="Search companies or pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <Home /> Home
          </CommandItem>
          <CommandItem onSelect={() => go("/companies")}>
            <Building2 /> All companies
          </CommandItem>
          <CommandItem onSelect={() => go("/revision")}>
            <Star /> Revision list
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Companies">
          {companies.map((c) => (
            <CommandItem key={c.slug} value={c.name} onSelect={() => go(`/companies/${c.slug}`)}>
              <Building2 />
              {c.name}
              <CommandShortcut>{c.problemCount} problems</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
