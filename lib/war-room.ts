import { prisma } from "@/lib/prisma";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const CODE_LENGTH = 6;

/**
 * Picks a random problemId, weighted toward higher-frequency company
 * problems — mirrors the `getRandomUnsolvedProblem` pattern in lib/data.ts
 * (candidate pool of up to 200 by frequency desc, then a random pick),
 * but is intentionally NOT imported from lib/data.ts per the spec.
 */
export async function pickRandomProblemId(): Promise<string> {
  const candidates = await prisma.companyProblem.findMany({
    select: { problemId: true },
    orderBy: { frequency: "desc" },
    take: 200,
  });

  if (candidates.length === 0) {
    // Fallback: no CompanyProblem rows at all — grab any problem directly.
    const anyProblem = await prisma.problem.findFirst({ select: { id: true } });
    if (!anyProblem) throw new Error("No problems available to start a duel");
    return anyProblem.id;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick.problemId;
}

/** Short, shareable room code, e.g. "8KQXPL". */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export type PlayerStatus = "waiting" | "active" | "solved";

export type RoomPlayer = {
  id: string;
  name: string | null;
  image: string | null;
} | null;

export type RoomState = {
  code: string;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  problem: {
    id: string;
    title: string;
    link: string;
    difficulty: string;
  };
  challenger: RoomPlayer;
  opponent: RoomPlayer;
  challengerId: string;
  opponentId: string | null;
  startTime: string | null;
  challengerSolvedAt: string | null;
  opponentSolvedAt: string | null;
  winnerId: string | null;
  elapsedSeconds: number | null;
  challengerStatus: PlayerStatus;
  opponentStatus: PlayerStatus;
};

/**
 * Fetches a Room by its shareable code and shapes it into a plain,
 * JSON-serializable state object (Dates -> ISO strings) with derived
 * fields for the UI (elapsed time, per-player status).
 */
export async function getRoomState(code: string): Promise<RoomState | null> {
  const room = await prisma.room.findUnique({
    where: { code },
    include: {
      problem: {
        select: { id: true, title: true, link: true, difficulty: true },
      },
      challenger: {
        select: { id: true, name: true, image: true },
      },
      opponent: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!room) return null;

  const now = Date.now();
  const elapsedSeconds = room.startTime
    ? Math.max(0, Math.floor((now - room.startTime.getTime()) / 1000))
    : null;

  const challengerStatus: PlayerStatus = room.challengerSolvedAt
    ? "solved"
    : room.startTime
      ? "active"
      : "waiting";

  const opponentStatus: PlayerStatus = room.opponentSolvedAt
    ? "solved"
    : room.opponentId
      ? "active"
      : "waiting";

  return {
    code: room.code,
    status: room.status,
    problem: {
      id: room.problem.id,
      title: room.problem.title,
      link: room.problem.link,
      difficulty: room.problem.difficulty,
    },
    challenger: room.challenger,
    opponent: room.opponent,
    challengerId: room.challengerId,
    opponentId: room.opponentId,
    startTime: room.startTime ? room.startTime.toISOString() : null,
    challengerSolvedAt: room.challengerSolvedAt ? room.challengerSolvedAt.toISOString() : null,
    opponentSolvedAt: room.opponentSolvedAt ? room.opponentSolvedAt.toISOString() : null,
    winnerId: room.winnerId,
    elapsedSeconds,
    challengerStatus,
    opponentStatus,
  };
}
