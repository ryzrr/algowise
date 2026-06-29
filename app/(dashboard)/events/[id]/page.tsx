import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, ExternalLink, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getEventDetail } from "@/lib/events";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { EventRsvpButton } from "@/components/event-rsvp-button";
import { EditEventDialog } from "@/components/edit-event-dialog";
import { DeleteEventButton } from "@/components/delete-event-button";
import { cn, avatarGradient } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  PREP: "Prep",
  SKILLS: "Skills",
  INTERVIEW_PREP: "Interview Prep",
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const result = await getEventDetail(id, session?.user?.id);

  if (!result) notFound();
  const { event, hasJoined } = result;

  const isHost = session?.user?.id === event.hostId;
  const isFull = event.capacity !== null && event._count.rsvps >= event.capacity;
  const spotsLabel = event.capacity !== null ? `${event._count.rsvps}/${event.capacity} going` : `${event._count.rsvps} going`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <Link href="/events" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Events
      </Link>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {CATEGORY_LABEL[event.category]}
          </span>
          {isHost && (
            <div className="flex items-center gap-2">
              <EditEventDialog
                eventId={event.id}
                initial={{
                  title: event.title,
                  description: event.description,
                  category: event.category,
                  startAt: event.startAt,
                  externalLink: event.externalLink,
                  capacity: event.capacity,
                }}
              />
              <DeleteEventButton eventId={event.id} eventTitle={event.title} />
            </div>
          )}
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight">{event.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {format(event.startAt, "EEEE, MMM d, yyyy · h:mm a")}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {spotsLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
          <Avatar size="sm">
            {event.host.image ? <AvatarImage src={event.host.image} alt={event.host.name ?? ""} /> : null}
            <AvatarFallback className={cn("bg-gradient-to-br font-semibold", avatarGradient(event.host.name || "H"))}>
              {(event.host.name || "H").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Hosted by {event.host.name || event.host.username || "Anonymous"}</p>
          </div>
        </div>

        <MarkdownContent content={event.description} />

        {event.externalLink && (
          <a
            href={event.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Join link
            <ExternalLink className="size-3.5" />
          </a>
        )}

        {!isHost && session?.user && (
          <EventRsvpButton eventId={event.id} joined={hasJoined} className="w-fit" />
        )}
        {!session?.user && (
          <Link href="/login" className="text-sm text-primary hover:underline">
            Sign in to RSVP
          </Link>
        )}
        {isFull && !hasJoined && <p className="text-xs text-destructive">This event is full.</p>}
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-heading text-lg font-semibold">Attendees ({event._count.rsvps})</h2>
        {event.rsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {event.rsvps.map((rsvp) => {
              const name = rsvp.user.name || rsvp.user.username || "Anonymous";
              return (
                <div key={rsvp.userId} className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-2.5 py-1">
                  <Avatar size="sm">
                    {rsvp.user.image ? <AvatarImage src={rsvp.user.image} alt={name} /> : null}
                    <AvatarFallback className={cn("bg-gradient-to-br text-xs font-semibold", avatarGradient(name))}>
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
