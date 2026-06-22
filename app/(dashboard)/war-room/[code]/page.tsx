import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoomState } from "@/lib/war-room";
import { joinRoom } from "@/actions/war-room-actions";
import { WarRoomView } from "@/components/war-room-view";

export default async function WarRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  let room = await getRoomState(code);
  if (!room) notFound();

  // Auto-join: visiting the invite link as a brand-new participant seats
  // you as the opponent and starts the shared countdown. `joinRoom` is
  // idempotent, so this is safe to call on every load (challenger /
  // existing opponent revisits are just no-ops).
  const isParticipant = room.challengerId === userId || room.opponentId === userId;
  if (!isParticipant && !room.opponentId) {
    const joined = await joinRoom(code);
    if (joined) room = joined;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <WarRoomView initialState={room} code={code} currentUserId={userId} />
    </div>
  );
}
