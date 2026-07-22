import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "predict_session";

function secret() {
  return process.env.SESSION_SECRET ?? "dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionValue(userId: string) {
  const payload = JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function setSession(userId: string) {
  cookies().set(COOKIE_NAME, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const value = cookies().get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    userId: string;
    exp: number;
  };
  if (payload.exp < Date.now()) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user?.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}
