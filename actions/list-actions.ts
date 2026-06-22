"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchProblemsByTitle } from "@/lib/lists";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createList(name: string, description?: string) {
  const userId = await requireUserId();

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("List name is required");

  const list = await prisma.list.create({
    data: {
      userId,
      name: trimmedName,
      description: description?.trim() || null,
    },
  });

  revalidatePath("/lists");
  return list.id;
}

export async function deleteList(listId: string) {
  const userId = await requireUserId();

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) throw new Error("Not found");

  await prisma.list.delete({ where: { id: listId } });

  revalidatePath("/lists");
}

export async function renameList(listId: string, name: string) {
  const userId = await requireUserId();

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) throw new Error("Not found");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("List name is required");

  await prisma.list.update({
    where: { id: listId },
    data: { name: trimmedName },
  });

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
}

export async function addProblemToList(listId: string, problemId: string) {
  const userId = await requireUserId();

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) throw new Error("Not found");

  await prisma.listProblem.upsert({
    where: { listId_problemId: { listId, problemId } },
    update: {},
    create: { listId, problemId },
  });

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
}

export async function searchProblems(query: string) {
  await requireUserId();
  return searchProblemsByTitle(query);
}

export async function removeProblemFromList(listId: string, problemId: string) {
  const userId = await requireUserId();

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) throw new Error("Not found");

  await prisma.listProblem.deleteMany({
    where: { listId, problemId },
  });

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
}
