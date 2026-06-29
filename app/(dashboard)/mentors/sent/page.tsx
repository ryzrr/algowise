import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSentFeedbackRequests } from "@/lib/mentors";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WithdrawFeedbackButton } from "@/components/withdraw-feedback-button";
import { cn, avatarGradient } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  RESPONDED: "Responded",
  WITHDRAWN: "Withdrawn",
};

export default async function SentFeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const requests = await getSentFeedbackRequests(session.user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <Link href="/mentors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Mentors
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">My Requests</h1>
        <p className="text-sm text-muted-foreground">Feedback requests you&apos;ve sent to mentors.</p>
      </div>

      {requests.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Send className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t requested feedback yet.{" "}
            <Link href="/mentors" className="text-primary hover:underline">
              Browse mentors
            </Link>
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => {
            const name = request.mentor.name || request.mentor.username || "Anonymous";
            return (
              <Card key={request.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {request.mentor.image ? <AvatarImage src={request.mentor.image} alt={name} /> : null}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{STATUS_LABEL[request.status]}</span>
                    {request.status === "PENDING" && <WithdrawFeedbackButton requestId={request.id} />}
                  </div>
                </div>
                <p className="font-medium text-sm">{request.topic}</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{request.message}</p>
                {request.response && (
                  <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-400 mb-1">{name}&apos;s response</p>
                    <p className="whitespace-pre-wrap text-sm">{request.response}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
