"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerRoomUpdate } from "@/lib/pusher";
import {
  generateRoomCode,
  getRoomState,
  pickRandomProblemId,
  type RoomState,
} from "@/lib/war-room";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/** Creates a new duel room owned by the current user, returns its code. */
export async function createRoom(problemId?: string): Promise<string> {
  const userId = await requireUserId();
  const resolvedProblemId = problemId ?? (await pickRandomProblemId());

  // Retry on the (rare) code collision since `code` is unique.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      const room = await prisma.room.create({
        data: {
          code,
          problemId: resolvedProblemId,
          challengerId: userId,
          status: "WAITING",
        },
      });
      return room.code;
    } catch (err) {
      const isUniqueViolation =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (!isUniqueViolation) throw err;
      // Collision on `code` — loop and try a new one.
    }
  }

  throw new Error("Could not allocate a unique room code, please try again");
}

/**
 * Joins a room as the opponent. Idempotent: revisiting the invite link
 * (e.g. the challenger themselves, or the existing opponent refreshing)
 * never errors — it just returns the current state.
 */
export async function joinRoom(code: string): Promise<RoomState | null> {
  const userId = await requireUserId();

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) return null;

  const isChallenger = room.challengerId === userId;
  const hasDifferentOpponent = !!room.opponentId && room.opponentId !== userId;

  if (!isChallenger && !room.opponentId) {
    const now = new Date();
    await prisma.room.update({
      where: { code },
      data: {
        opponentId: userId,
        status: "ACTIVE",
        startTime: now,
      },
    });

    const state = await getRoomState(code);
    await triggerRoomUpdate(code, "joined", state);
    revalidatePath(`/war-room/${code}`);
    return state;
  }

  // Already the challenger, already the opponent, or room already has a
  // different opponent — just return current state, no error.
  void hasDifferentOpponent;
  return getRoomState(code);
}

/** Marks the current user as having solved the duel's problem. */
export async function markSolved(code: string): Promise<RoomState | null> {
  const userId = await requireUserId();

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) return null;

  const isChallenger = room.challengerId === userId;
  const isOpponent = room.opponentId === userId;
  if (!isChallenger && !isOpponent) {
    // Spectator-ish call (shouldn't normally happen) — no-op.
    return getRoomState(code);
  }

  const now = new Date();
  const data: {
    challengerSolvedAt?: Date;
    opponentSolvedAt?: Date;
    winnerId?: string;
    status?: "FINISHED";
  } = {};

  if (isChallenger && !room.challengerSolvedAt) {
    data.challengerSolvedAt = now;
  }
  if (isOpponent && !room.opponentSolvedAt) {
    data.opponentSolvedAt = now;
  }

  if (!room.winnerId && (data.challengerSolvedAt || data.opponentSolvedAt)) {
    data.winnerId = userId;
    data.status = "FINISHED";
  }

  if (Object.keys(data).length > 0) {
    await prisma.room.update({ where: { code }, data });
  }

  const state = await getRoomState(code);
  await triggerRoomUpdate(code, "solved", state);
  revalidatePath(`/war-room/${code}`);
  return state;
}

/** Thin wrapper for client-side polling. */
export async function getRoomStateAction(code: string): Promise<RoomState | null> {
  return getRoomState(code);
}
