import Pusher from "pusher";

let cachedClient: Pusher | null | undefined;

/**
 * Returns a configured Pusher server instance, or `null` if any of the
 * required env vars are missing. War Room must work fully without Pusher
 * (client-side polling is the safety net), so callers must treat `null`
 * as a normal, expected case — not an error.
 */
export function getPusherServer(): Pusher | null {
  if (cachedClient !== undefined) return cachedClient;

  const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER } =
    process.env;

  if (!PUSHER_APP_ID || !NEXT_PUBLIC_PUSHER_KEY || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Pusher({
    appId: PUSHER_APP_ID,
    key: NEXT_PUBLIC_PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });

  return cachedClient;
}

/**
 * Fires a Pusher event for a War Room. No-ops silently if Pusher isn't
 * configured, and never throws — a Pusher hiccup must never break the
 * underlying DB-backed server action that called it.
 */
export async function triggerRoomUpdate(code: string, event: string, data: unknown) {
  const client = getPusherServer();
  if (!client) return;

  try {
    await client.trigger(`war-room-${code}`, event, data);
  } catch {
    // Real-time push is a nice-to-have on top of the poll safety net.
  }
}
