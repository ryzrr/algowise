import Link from "next/link";
import { GraduationCap, Sparkles, Inbox, Send } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMentors } from "@/lib/mentors";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { RequestFeedbackDialog } from "@/components/request-feedback-dialog";
import { cn, avatarGradient } from "@/lib/utils";

export default async function MentorsPage() {
  const session = await auth();
  const [mentors, currentUser] = await Promise.all([
    getMentors(),
    session?.user?.id
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { isMentor: true } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <Link href="/community" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Community
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Mentors</h1>
          <p className="text-sm text-muted-foreground">
            Connect with senior engineers for real, written interview feedback.
          </p>
        </div>
        {session?.user && (
          <div className="flex items-center gap-2">
            <Link href="/mentors/sent" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
              <Send className="size-4" />
              My requests
            </Link>
            {currentUser?.isMentor && (
              <Link href="/mentors/inbox" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
                <Inbox className="size-4" />
                Feedback inbox
              </Link>
            )}
          </div>
        )}
      </div>

      {!currentUser?.isMentor && (
        <Card className="flex flex-row items-start gap-3 border-primary/30 bg-primary/5 p-5">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Become a mentor</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Already a senior engineer or interviewer? List yourself in the directory and help others prep.
            </p>
            <Link href="/settings" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              Set up your mentor profile →
            </Link>
          </div>
        </Card>
      )}

      {mentors.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No mentors listed yet. Be the first to offer feedback.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor, i) => {
            const name = mentor.name || mentor.username || "Anonymous";
            return (
              <Card
                key={mentor.id}
                className="flex flex-col gap-3 p-5 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    {mentor.image ? <AvatarImage src={mentor.image} alt={name} /> : null}
                    <AvatarFallback className={cn("bg-gradient-to-br font-semibold", avatarGradient(name))}>
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-semibold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {mentor.mentorTitle} @ {mentor.mentorCompany}
                    </p>
                    {mentor.mentorYears && (
                      <p className="text-xs text-muted-foreground">{mentor.mentorYears} years experience</p>
                    )}
                  </div>
                </div>

                {mentor.mentorBio && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{mentor.mentorBio}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {mentor.username && (
                    <Link href={`/u/${mentor.username}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                      View profile
                    </Link>
                  )}
                  {session?.user && session.user.id !== mentor.id && (
                    <RequestFeedbackDialog mentorId={mentor.id} mentorName={name} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
