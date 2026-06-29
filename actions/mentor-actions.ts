"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateMentorProfile(input: {
  isMentor: boolean;
  mentorTitle?: string;
  mentorCompany?: string;
  mentorBio?: string;
  mentorYears?: number;
}): Promise<void> {
  const userId = await requireUserId();

  const mentorTitle = input.mentorTitle?.trim() || null;
  const mentorCompany = input.mentorCompany?.trim() || null;

  if (input.isMentor && (!mentorTitle || !mentorCompany)) {
    throw new Error("Title and company are required to be listed as a mentor");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isMentor: input.isMentor,
      mentorTitle,
      mentorCompany,
      mentorBio: input.mentorBio?.trim() || null,
      mentorYears: input.mentorYears && input.mentorYears > 0 ? Math.floor(input.mentorYears) : null,
    },
    select: { username: true },
  });

  revalidatePath("/settings");
  revalidatePath("/mentors");
  if (user.username) revalidatePath(`/u/${user.username}`);
}

export async function createFeedbackRequest(
  mentorId: string,
  input: { topic: string; message: string }
): Promise<string> {
  const userId = await requireUserId();

  if (mentorId === userId) throw new Error("You can't request feedback from yourself");

  const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
  if (!mentor || !mentor.isMentor) throw new Error("Mentor not found");

  const topic = input.topic.trim();
  const message = input.message.trim();
  if (!topic || !message) throw new Error("Topic and message are required");

  const request = await prisma.feedbackRequest.create({
    data: { requesterId: userId, mentorId, topic, message },
  });

  revalidatePath("/mentors/sent");
  return request.id;
}

export async function respondToFeedbackRequest(requestId: string, response: string): Promise<void> {
  const userId = await requireUserId();

  const request = await prisma.feedbackRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.mentorId !== userId) throw new Error("Not authorized");
  if (request.status !== "PENDING") throw new Error("This request has already been handled");

  const trimmed = response.trim();
  if (!trimmed) throw new Error("Response cannot be empty");

  await prisma.feedbackRequest.update({
    where: { id: requestId },
    data: { status: "RESPONDED", response: trimmed, respondedAt: new Date() },
  });

  revalidatePath("/mentors/inbox");
}

export async function withdrawFeedbackRequest(requestId: string): Promise<void> {
  const userId = await requireUserId();

  const request = await prisma.feedbackRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.requesterId !== userId) throw new Error("Not authorized");
  if (request.status !== "PENDING") throw new Error("This request has already been handled");

  await prisma.feedbackRequest.update({
    where: { id: requestId },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/mentors/sent");
}

