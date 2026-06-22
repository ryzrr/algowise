"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { scheduleNextReview } from "@/lib/spaced-repetition";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function reviewProblem(problemId: string, outcome: "easy" | "struggled") {
  const userId = await requireUserId();
  await scheduleNextReview(userId, problemId, outcome);
  revalidatePath("/revision");
}
