import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${key}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, key] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const actual = pbkdf2Sync(password, salt, Number(iterations), expected.length, DIGEST);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
