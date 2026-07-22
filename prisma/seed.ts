import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.INITIAL_ADMIN_USERNAME ?? "admin";
  const name = process.env.INITIAL_ADMIN_NAME ?? "Admin";
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? "change-me";

  await prisma.user.upsert({
    where: { username },
    update: { role: "ADMIN", active: true },
    create: {
      username,
      name,
      role: "ADMIN",
      passwordHash: await hashPassword(password)
    }
  });

  const kickoff = new Date();
  kickoff.setDate(kickoff.getDate() + 7);
  kickoff.setHours(21, 45, 0, 0);

  await prisma.match.upsert({
    where: { externalId: "demo-romania-home" },
    update: {},
    create: {
      externalId: "demo-romania-home",
      competition: "EURO Qualification",
      homeTeam: "Romania",
      awayTeam: "Opponent TBD",
      kickoffAt: kickoff
    }
  });

  await prisma.tournament.upsert({
    where: { name: "UEFA Nations League 2026/27" },
    update: { active: true },
    create: { name: "UEFA Nations League 2026/27", active: true }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
