import { randomBytes } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly invite code with the visually-confusing characters removed. */
export function randomInviteCode(length = 7): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function slugify(value: string): string {
  return normalizeUsername(value).replace(/[^a-z0-9_]/g, "");
}
