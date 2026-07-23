"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, requireAdmin, requireUser, setSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { syncRomaniaFixtures } from "@/lib/sync-romania";
import { syncVerifiedRomaniaFixtures } from "@/lib/verified-fixtures";

const positiveScore = z.coerce.number().int().min(0).max(30);
const roleSchema = z.enum(["USER", "ADMIN"]);
const statusSchema = z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"]);
const defaultActiveTournament = "UEFA Nations League 2026/27";

async function ensureTournament(name: string) {
  await prisma.tournament.upsert({
    where: { name },
    update: {},
    create: { name, active: name === defaultActiveTournament }
  });
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = z
    .object({
      username: z.string().min(2).max(32),
      password: z.string().min(1)
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: "Introdu un username si o parola valide." };

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username.toLowerCase() } });
  if (!user?.active || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Datele de login nu sunt corecte." };
  }

  setSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}

export async function updateAccountAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().optional(),
      username: z.string().trim().optional(),
      password: z.string().optional(),
      confirmPassword: z.string().optional()
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { ok: false, message: "Datele introduse nu sunt valide." };

  const name = parsed.data.name?.trim();
  const username = parsed.data.username?.trim().toLowerCase();
  const password = parsed.data.password ?? "";
  const confirmPassword = parsed.data.confirmPassword ?? "";
  const data: { name?: string; username?: string; passwordHash?: string } = {};

  if (name) {
    const validName = z.string().min(2).max(40).safeParse(name);
    if (!validName.success) {
      return { ok: false, message: "Numele afisat trebuie sa aiba intre 2 si 40 de caractere." };
    }

    data.name = name;
  }

  if (username) {
    const validUsername = z.string().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/).safeParse(username);
    if (!validUsername.success) {
      return { ok: false, message: "Username-ul de login poate contine doar litere, cifre, _ sau - si minim 2 caractere." };
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser && existingUser.id !== user.id) {
      return { ok: false, message: "Username-ul de login este deja folosit." };
    }

    data.username = username;
  }

  if (password || confirmPassword) {
    if (password.length < 8) return { ok: false, message: "Parola trebuie sa aiba cel putin 8 caractere." };
    if (password !== confirmPassword) {
      return { ok: false, message: "Parolele nu coincid." };
    }

    data.passwordHash = await hashPassword(password);
  }

  if (!data.name && !data.username && !data.passwordHash) {
    return { ok: false, message: "Completeaza un nume afisat nou, un username de login nou sau o parola noua." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data
  });

  const changed = [
    data.name ? "numele afisat" : null,
    data.username ? "username-ul de login" : null,
    data.passwordHash ? "parola" : null
  ].filter(Boolean);

  return { ok: true, message: `${changed.join(", ")} ${changed.length === 1 ? "a fost schimbat(a)" : "au fost schimbate"}.` };
}

export async function savePredictionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      matchId: z.string().min(1),
      homeGoals: positiveScore,
      awayGoals: positiveScore
    })
    .parse(Object.fromEntries(formData));

  const match = await prisma.match.findUnique({ where: { id: parsed.matchId } });
  if (!match) throw new Error("Match not found");
  if (match.kickoffAt <= new Date() || match.status !== "SCHEDULED") {
    throw new Error("Predictions are locked for this match");
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId: parsed.matchId } },
    update: { homeGoals: parsed.homeGoals, awayGoals: parsed.awayGoals, lockedAt: new Date() },
    create: {
      userId: user.id,
      matchId: parsed.matchId,
      homeGoals: parsed.homeGoals,
      awayGoals: parsed.awayGoals
    }
  });

  revalidatePath("/");
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().min(2),
      username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/),
      password: z.string().min(8),
      role: roleSchema.default("USER")
    })
    .parse(Object.fromEntries(formData));

  await prisma.user.create({
    data: {
      name: parsed.name,
      username: parsed.username.toLowerCase(),
      role: parsed.role,
      passwordHash: await hashPassword(parsed.password)
    }
  });

  revalidatePath("/admin");
}

export async function toggleUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  if (userId === admin.id) throw new Error("You cannot deactivate yourself");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  if (userId === admin.id) throw new Error("You cannot delete yourself");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}

export async function upsertMatchAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      matchId: z.string().optional(),
      competition: z.string().min(2),
      homeTeam: z.string().min(2),
      awayTeam: z.string().min(2),
      kickoffAt: z.string().min(1),
      status: statusSchema,
      homeScore: z.string().optional(),
      awayScore: z.string().optional()
    })
    .parse(Object.fromEntries(formData));

  const data = {
    competition: parsed.competition,
    homeTeam: parsed.homeTeam,
    awayTeam: parsed.awayTeam,
    kickoffAt: new Date(parsed.kickoffAt),
    status: parsed.status,
    homeScore: parsed.status === "FINISHED" && parsed.homeScore !== "" ? Number(parsed.homeScore) : null,
    awayScore: parsed.status === "FINISHED" && parsed.awayScore !== "" ? Number(parsed.awayScore) : null
  };

  await ensureTournament(parsed.competition);

  if (parsed.matchId) {
    await prisma.match.update({ where: { id: parsed.matchId }, data });
  } else {
    await prisma.match.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createTournamentAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      active: z.string().optional()
    })
    .parse(Object.fromEntries(formData));

  await prisma.tournament.upsert({
    where: { name: parsed.name },
    update: { active: parsed.active === "on" },
    create: { name: parsed.name, active: parsed.active === "on" }
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleTournamentAction(formData: FormData) {
  await requireAdmin();
  const tournamentId = String(formData.get("tournamentId"));
  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { active: !tournament.active }
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  await prisma.match.delete({ where: { id: String(formData.get("matchId")) } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function syncRomaniaFixturesAction(_: unknown, __: FormData) {
  await requireAdmin();
  try {
    const competitionCode = String(__.get("competitionCode") ?? "EC");
    const result = (await syncVerifiedRomaniaFixtures(competitionCode)) ?? (await syncRomaniaFixtures(competitionCode));
    revalidatePath("/");
    revalidatePath("/admin");
    if (result.endpoint === "UEFA/FRF public fixtures") {
      return {
        ok: true,
        message: `Sincronizare reusita: ${result.synced} meciuri Romania importate din programul public UEFA/FRF.`
      };
    }

    if (result.fetched === 0) {
      return {
        ok: true,
        message: `Conexiunea merge si Team ID-ul Romaniei este ${result.teamId}, dar football-data.org nu returneaza meciuri pentru competitia curenta in intervalul cautat.`
      };
    }

    return {
      ok: true,
      message: `Sincronizare reusita: ${result.synced} meciuri Romania importate din ${result.fetched} meciuri gasite. Team ID: ${result.teamId}.`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sincronizarea a esuat.";
    return { ok: false, message };
  }
}
