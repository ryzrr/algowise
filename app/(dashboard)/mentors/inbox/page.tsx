import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Inbox } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMentorInbox } from "@/lib/mentors";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RespondFeedbackForm } from "@/components/respond-feedback-form";
import { cn, avatarGradient } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  RESPONDED: "Responded",
  WITHDRAWN: "Withdrawn",
};

export default async function MentorInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isMentor: true } });

  const requests = await getMentorInbox(session.user.id);
  const pending = requests.filter((r) => r.status === "PENDING");
  const history = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <Link href="/mentors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Mentors
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Feedback Inbox</h1>
        <p className="text-sm text-muted-foreground">Requests from people asking for your feedback.</p>
      </div>

      {!user?.isMentor && (
        <Card className="p-5 text-sm text-muted-foreground">
          You&apos;re not currently listed as a mentor — set up your mentor profile in{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Settings
          </Link>{" "}
          to receive requests.
        </Card>
      )}

      {requests.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No feedback requests yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="label-mono text-xs">Pending ({pending.length})</span>
              {pending.map((request) => {
                const name = request.requester.name || request.requester.username || "Anonymous";
                return (
                  <Card key={request.id} className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {request.requester.image ? <AvatarImage src={request.requester.image} alt={name} /> : null}
                        <AvatarFallback className={cn("bg-gradient-to-br text-xs font-semibold", avatarGradient(name))}>
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-sm">{request.topic}</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{request.message}</p>
                    <RespondFeedbackForm requestId={request.id} />
                  </Card>
                );
              })}
            </div>
          )}

          {history.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="label-mono text-xs">History</span>
              {history.map((request) => {
                const name = request.requester.name || request.requester.username || "Anonymous";
                return (
                  <Card key={request.id} className="flex flex-col gap-2 p-5 opacity-80">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{name}</p>
                      <span className="text-xs text-muted-foreground">{STATUS_LABEL[request.status]}</span>
                    </div>
                    <p className="font-medium text-sm">{request.topic}</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{request.message}</p>
                    {request.response && (
                      <div className="mt-1 rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your response</p>
                        <p className="whitespace-pre-wrap text-sm">{request.response}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
