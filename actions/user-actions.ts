"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

const USERNAME_REGEX = /^[a-z][a-z0-9-]{2,19}$/;

export async function updateUsername(username: string) {
  const userId = await requireUserId();

  const normalized = username.trim().toLowerCase();

  if (!USERNAME_REGEX.test(normalized)) {
    throw new Error(
      "Username must be 3-20 characters, start with a letter, and contain only lowercase letters, digits, and hyphens."
    );
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username: normalized },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      throw new Error("Username already taken");
    }
    throw err;
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${normalized}`);

  return { username: normalized };
}
