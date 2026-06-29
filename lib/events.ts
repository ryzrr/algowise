import { prisma } from "@/lib/prisma";

const hostSelect = {
  select: { id: true, name: true, username: true, image: true },
} as const;

export async function getUpcomingEvents(category?: "PREP" | "SKILLS" | "INTERVIEW_PREP") {
  const events = await prisma.event.findMany({
    where: {
      startAt: { gte: new Date() },
      ...(category ? { category } : {}),
    },
    orderBy: { startAt: "asc" },
    include: {
      host: hostSelect,
      _count: { select: { rsvps: true } },
    },
  });

  return events;
}

export async function getEventDetail(eventId: string, userId?: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      host: hostSelect,
      rsvps: {
        orderBy: { createdAt: "asc" },
        take: 50,
        include: { user: hostSelect },
      },
      _count: { select: { rsvps: true } },
    },
  });

  if (!event) return null;

  const hasJoined = userId
    ? (await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } })) !== null
    : false;

  return { event, hasJoined };
}

export type UpcomingEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number];
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventDetail>>>;
