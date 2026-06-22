"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function postDiscussionComment(
  problemId: string,
  content: string,
  parentId?: string
) {
  const userId = await requireUserId();

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  await prisma.problemDiscussion.create({
    data: {
      problemId,
      authorId: userId,
      content: trimmed,
      parentId: parentId ?? null,
    },
  });

  revalidatePath(`/problems/${problemId}`);
}

export async function deleteDiscussionComment(commentId: string) {
  const userId = await requireUserId();

  const comment = await prisma.problemDiscussion.findUnique({
    where: { id: commentId },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Not authorized");

  await prisma.$transaction([
    prisma.problemDiscussion.deleteMany({ where: { parentId: commentId } }),
    prisma.problemDiscussion.delete({ where: { id: commentId } }),
  ]);

  revalidatePath(`/problems/${comment.problemId}`);
}
