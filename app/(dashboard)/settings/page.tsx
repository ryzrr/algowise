import { redirect } from "next/navigation";
import { Link2, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { UsernameForm } from "@/components/username-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and public profile.</p>
      </div>

      {!user?.username && (
        <Card className="flex flex-row items-start gap-3 border-primary/30 bg-primary/5 p-5">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Claim your username</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Get a shareable public profile to show off your progress — perfect for LinkedIn.
            </p>
          </div>
        </Card>
      )}

      <Card className="gap-4 p-6">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Link2 className="size-4" />
          <span className="label-mono">Public profile</span>
        </div>
        <UsernameForm initialUsername={user?.username ?? null} />
      </Card>
    </div>
  );
}
