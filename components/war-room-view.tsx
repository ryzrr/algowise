"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Swords,
  Timer,
  Crown,
  Copy,
  ExternalLink,
  Loader2,
  Hourglass,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { cn, avatarGradient } from "@/lib/utils";
import { markSolved, getRoomStateAction } from "@/actions/war-room-actions";
import type { PlayerStatus, RoomState } from "@/lib/war-room";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const POLL_INTERVAL_MS = 2500;

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function StatusBadge({ status, hasJoined }: { status: PlayerStatus; hasJoined: boolean }) {
  if (!hasJoined) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Hourglass className="size-3" />
        waiting to join
      </span>
    );
  }
  if (status === "solved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="size-3" />
        solved it!
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
      <BrainCircuit className="size-3" />
      thinking…
    </span>
  );
}

function PlayerCard({
  player,
  status,
  isCurrentUser,
  fallbackLabel,
}: {
  player: { id: string; name: string | null; image: string | null } | null;
  status: PlayerStatus;
  isCurrentUser: boolean;
  fallbackLabel: string;
}) {
  const hasJoined = !!player;
  const name = player?.name ?? fallbackLabel;

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-3 rounded-xl border p-4 transition-colors",
        hasJoined ? "border-border bg-card" : "border-dashed border-border bg-muted/20"
      )}
    >
      <Avatar size="lg" className={cn("bg-gradient-to-br", avatarGradient(name))}>
        {player?.image && <AvatarImage src={player.image} alt={name} />}
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
          <span className="truncate">{name}</span>
          {isCurrentUser && (
            <span className="shrink-0 text-xs font-normal text-muted-foreground">(you)</span>
          )}
        </div>
        <StatusBadge status={status} hasJoined={hasJoined} />
      </div>
    </div>
  );
}

export function WarRoomView({
  initialState,
  code,
  currentUserId,
}: {
  initialState: RoomState;
  code: string;
  currentUserId: string;
}) {
  const [room, setRoom] = useState<RoomState>(initialState);
  const [marking, setMarking] = useState(false);
  const celebratedRef = useRef(false);

  const refresh = useCallback(async () => {
    const next = await getRoomStateAction(code);
    if (next) setRoom(next);
  }, [code]);

  // Safety-net polling — always runs, regardless of Pusher availability.
  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Real-time push — only attempted if Pusher is actually configured.
  useEffect(() => {
    if (!PUSHER_KEY) return;

    let channel: { unbind_all: () => void } | undefined;
    let pusherClient: { unsubscribe: (name: string) => void; disconnect: () => void } | undefined;

    (async () => {
      try {
        const { default: PusherClient } = await import("pusher-js");
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "";
        const client = new PusherClient(PUSHER_KEY!, { cluster });
        pusherClient = client;
        const ch = client.subscribe(`war-room-${code}`);
        channel = ch;
        ch.bind("joined", refresh);
        ch.bind("solved", refresh);
      } catch {
        // Pusher is best-effort; polling already covers us.
      }
    })();

    return () => {
      channel?.unbind_all();
      pusherClient?.unsubscribe(`war-room-${code}`);
      pusherClient?.disconnect();
    };
  }, [code, refresh]);

  // Live elapsed-time ticking between polls/pushes. `Date.now()` is an
  // impure call, so it's only ever read from inside the interval's async
  // callback — never synchronously in the render path or effect body.
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(
    room.elapsedSeconds ?? null
  );
  useEffect(() => {
    const startTime = room.startTime;
    if (!startTime) return;
    const startMs = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [room.startTime]);

  const isChallenger = room.challengerId === currentUserId;
  const isOpponent = room.opponentId === currentUserId;
  const isParticipant = isChallenger || isOpponent;
  const mySolvedAt = isChallenger ? room.challengerSolvedAt : room.opponentSolvedAt;
  const alreadySolved = !!mySolvedAt;
  const isFinished = room.status === "FINISHED";
  const won = isFinished && room.winnerId === currentUserId;

  useEffect(() => {
    if (won && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      toast.success("You won the duel!");
    }
  }, [won]);

  async function handleMarkSolved() {
    setMarking(true);
    try {
      const next = await markSolved(code);
      if (next) setRoom(next);
    } finally {
      setMarking(false);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/war-room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-bold tracking-tight">
            <Swords className="size-7 text-primary" />
            War Room
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Room code: {code}</p>
        </div>
        <Button variant="outline" onClick={handleCopyLink}>
          <Copy />
          Copy invite link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              The problem
              <DifficultyBadge difficulty={room.problem.difficulty} />
            </span>
            <a
              href={room.problem.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm font-normal text-primary hover:underline"
            >
              Open <ExternalLink className="size-3.5" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{room.problem.title}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="size-4" />
            <span className="label-mono text-xs">
              {room.startTime ? "Elapsed time" : "Waiting for opponent to join…"}
            </span>
          </div>
          <div className="font-mono text-4xl font-bold tabular-nums">
            {elapsedSeconds !== null ? formatElapsed(elapsedSeconds) : "--:--"}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <PlayerCard
          player={room.challenger}
          status={room.challengerStatus}
          isCurrentUser={isChallenger}
          fallbackLabel="Challenger"
        />
        <div className="flex items-center justify-center text-muted-foreground">
          <span className="font-heading text-sm font-bold">VS</span>
        </div>
        <PlayerCard
          player={room.opponent}
          status={room.opponentStatus}
          isCurrentUser={isOpponent}
          fallbackLabel="Waiting for opponent…"
        />
      </div>

      {isFinished ? (
        <Card className={cn(won ? "ring-2 ring-emerald-500/40" : "ring-1 ring-border")}>
          <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
            <Crown className={cn("size-8", won ? "text-amber-400" : "text-muted-foreground")} />
            <p className="font-heading text-xl font-bold">
              {won ? "You won the duel!" : "Your opponent solved it first."}
            </p>
            <p className="text-sm text-muted-foreground">
              {won
                ? "Great work — keep that momentum going."
                : "Good effort. Run it back with another duel."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="lg"
          className="self-center"
          onClick={handleMarkSolved}
          disabled={alreadySolved || marking || !room.startTime || !isParticipant}
        >
          {marking ? <Loader2 className="animate-spin" /> : <Crown />}
          {alreadySolved ? "You marked this solved" : "Mark Solved"}
        </Button>
      )}
    </div>
  );
}
