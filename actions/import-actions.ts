"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { importLeetCodeProgress } from "@/lib/leetcode-import";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function importLeetCodeProgressAction(leetcodeUsername: string) {
  const userId = await requireUserId();

  const trimmed = leetcodeUsername.trim();
  if (!trimmed) {
    throw new Error("Please enter your LeetCode username.");
  }

  const summary = await importLeetCodeProgress(userId, trimmed);

  revalidatePath("/");
  revalidatePath("/achievements");
  revalidatePath("/import");

  return summary;
}
