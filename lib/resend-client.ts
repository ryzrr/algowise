import { Resend } from "resend";

let cachedClient: Resend | null = null;
let cachedKey: string | null = null;

/**
 * Lazily constructs a Resend client from RESEND_API_KEY.
 * Returns null (never throws) if the key is missing/empty so callers
 * can no-op gracefully when email sending isn't configured yet.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (cachedClient && cachedKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new Resend(apiKey);
  cachedKey = apiKey;
  return cachedClient;
}
