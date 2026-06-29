"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EventCategory } from "@prisma/client";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createEvent(input: {
  title: string;
  description: string;
  category: EventCategory;
  startAt: string;
  externalLink?: string;
  capacity?: number;
}): Promise<string> {
  const userId = await requireUserId();

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new Error("Title is required");
  if (!description) throw new Error("Description is required");

  const startAt = new Date(input.startAt);
  if (isNaN(startAt.getTime())) throw new Error("Invalid date/time");

  const capacity = input.capacity && input.capacity > 0 ? Math.floor(input.capacity) : undefined;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      category: input.category,
      startAt,
      externalLink: input.externalLink?.trim() || null,
      capacity: capacity ?? null,
      hostId: userId,
    },
  });

  revalidatePath("/events");
  return event.id;
}

export async function updateEvent(
  eventId: string,
  input: {
    title: string;
    description: string;
    category: EventCategory;
    startAt: string;
    externalLink?: string;
    capacity?: number;
  }
): Promise<void> {
  const userId = await requireUserId();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.hostId !== userId) throw new Error("Not found");

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new Error("Title is required");
  if (!description) throw new Error("Description is required");

  const startAt = new Date(input.startAt);
  if (isNaN(startAt.getTime())) throw new Error("Invalid date/time");

  const capacity = input.capacity && input.capacity > 0 ? Math.floor(input.capacity) : undefined;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      category: input.category,
      startAt,
      externalLink: input.externalLink?.trim() || null,
      capacity: capacity ?? null,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const userId = await requireUserId();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.hostId !== userId) throw new Error("Not found");

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/events");
}

/** Idempotent RSVP toggle: joins if there's room, leaves if already joined. Never throws on a full event — just reports it. */
export async function rsvpToEvent(
  eventId: string
): Promise<{ joined: boolean; count: number; full: boolean }> {
  const userId = await requireUserId();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const existing = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    await prisma.eventRsvp.delete({ where: { eventId_userId: { eventId, userId } } });
    const count = await prisma.eventRsvp.count({ where: { eventId } });
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { joined: false, count, full: false };
  }

  const count = await prisma.eventRsvp.count({ where: { eventId } });
  if (event.capacity !== null && count >= event.capacity) {
    return { joined: false, count, full: true };
  }

  await prisma.eventRsvp.create({ data: { eventId, userId } });
  const newCount = count + 1;
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return { joined: true, count: newCount, full: event.capacity !== null && newCount >= event.capacity };
}
