import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LEN = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!password || !stored?.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const attempt = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  if (attempt.length !== expected.length) return false;
  return timingSafeEqual(attempt, expected);
}
