import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Plus, MapPin, Users } from "lucide-react";
import { getUpcomingEvents } from "@/lib/events";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@prisma/client";

const CATEGORY_LABEL: Record<EventCategory, string> = {
  PREP: "Prep",
  SKILLS: "Skills",
  INTERVIEW_PREP: "Interview Prep",
};

function categoryHref(category?: EventCategory) {
  return category ? `/events?category=${category}` : "/events";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const category =
    categoryParam === "PREP" || categoryParam === "SKILLS" || categoryParam === "INTERVIEW_PREP"
      ? categoryParam
      : undefined;

  const events = await getUpcomingEvents(category);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <Link href="/community" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Community
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">
            Mock interviews, study sessions, and skill workshops — created by the community.
          </p>
        </div>
        <Link href="/events/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Create Event
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        <Link
          href={categoryHref()}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            !category ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          All
        </Link>
        {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
          <Link
            key={c}
            href={categoryHref(c)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              category === c ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {CATEGORY_LABEL[c]}
          </Link>
        ))}
      </nav>

      {events.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No upcoming events yet. Create one to start a prep session with the community.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const spotsLabel =
              event.capacity !== null
                ? `${event._count.rsvps}/${event.capacity} going`
                : `${event._count.rsvps} going`;
            const isFull = event.capacity !== null && event._count.rsvps >= event.capacity;
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
              >
                <Card className="group relative flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:ring-white/20 active:translate-y-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {CATEGORY_LABEL[event.category]}
                    </span>
                    {isFull && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Full
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 font-heading text-base font-semibold tracking-tight">
                    {event.title}
                  </p>

                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {format(event.startAt, "EEE, MMM d · h:mm a")}
                  </p>

                  {event.externalLink && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      Online
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {spotsLabel}
                    </span>
                    <span>Hosted by {event.host.name || event.host.username || "Anonymous"}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
