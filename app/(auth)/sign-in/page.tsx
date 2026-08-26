import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signInWithGitHub, signInWithGoogle } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, CalendarDays } from "lucide-react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { GoogleIcon } from "@/components/icons/google-icon";
import { LogoMark } from "@/components/icons/logo-mark";
import { FloatingSymbols } from "@/components/floating-symbols";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="bg-grid-bright relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background">
      <FloatingSymbols />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center">
        <div className="flex items-center gap-2.5 duration-700 animate-in fade-in zoom-in-95 fill-mode-both">
          <LogoMark className="size-11" />
          <span className="font-heading text-xl font-semibold tracking-tight">AlgoWise</span>
        </div>

        <div className="delay-100 duration-700 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          <p className="label-mono mb-3">~/interview-prep</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Track your interview prep, <span className="text-primary">company by company.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            187 companies, 1,200+ tagged questions, sorted by how often
            they&apos;re actually asked.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5 delay-200 duration-700 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          <form action={signInWithGitHub}>
            <Button type="submit" size="lg" className="w-full gap-2 transition-transform active:scale-[0.98]">
              <GitHubIcon className="size-4" />
              Continue with GitHub
            </Button>
          </form>
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              size="lg"
              variant="outline"
              className="w-full gap-2 transition-transform active:scale-[0.98]"
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
          </form>
        </div>

        <div className="flex w-full flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/40 text-left delay-300 duration-700 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          {[
            { Icon: Flame, label: "Daily streaks", hint: "stay consistent" },
            { Icon: Trophy, label: "Progress tracking", hint: "per company" },
            { Icon: CalendarDays, label: "Activity heatmap", hint: "20-week view" },
          ].map(({ Icon, label, hint }) => (
            <div
              key={label}
              className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                strokeWidth={2}
              />
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="label-mono ml-auto">{hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
