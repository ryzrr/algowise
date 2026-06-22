"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { startStorySession, evaluateCurrentStage } from "@/lib/story-mode";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function startStorySessionAction(companySlug: string) {
  const userId = await requireUserId();
  const sessionId = await startStorySession(companySlug, userId);
  revalidatePath("/story-mode");
  return sessionId;
}

export async function evaluateCurrentStageAction(sessionId: string) {
  const userId = await requireUserId();
  const result = await evaluateCurrentStage(sessionId, userId);
  revalidatePath(`/story-mode/${sessionId}`);
  return result;
}
