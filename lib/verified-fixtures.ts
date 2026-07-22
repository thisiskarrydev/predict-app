import { prisma } from "./prisma";

type VerifiedFixture = {
  externalId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
};

const romaniaNationsLeagueFixtures: VerifiedFixture[] = [
  {
    externalId: "uefa-nations-league-2026-b4-sweden-romania",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Suedia",
    awayTeam: "Romania",
    kickoffAt: "2026-09-25T18:45:00.000Z"
  },
  {
    externalId: "uefa-nations-league-2026-b4-romania-bosnia",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Romania",
    awayTeam: "Bosnia si Hertegovina",
    kickoffAt: "2026-09-28T18:45:00.000Z"
  },
  {
    externalId: "uefa-nations-league-2026-b4-poland-romania",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Polonia",
    awayTeam: "Romania",
    kickoffAt: "2026-10-02T18:45:00.000Z"
  },
  {
    externalId: "uefa-nations-league-2026-b4-romania-sweden",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Romania",
    awayTeam: "Suedia",
    kickoffAt: "2026-10-05T18:45:00.000Z"
  },
  {
    externalId: "uefa-nations-league-2026-b4-romania-poland",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Romania",
    awayTeam: "Polonia",
    kickoffAt: "2026-11-14T19:45:00.000Z"
  },
  {
    externalId: "uefa-nations-league-2026-b4-bosnia-romania",
    competition: "UEFA Nations League 2026/27",
    homeTeam: "Bosnia si Hertegovina",
    awayTeam: "Romania",
    kickoffAt: "2026-11-17T19:45:00.000Z"
  }
];

export async function syncVerifiedRomaniaFixtures(code: string) {
  if (code !== "UNL_ROMANIA_2026") return null;

  await prisma.tournament.upsert({
    where: { name: "UEFA Nations League 2026/27" },
    update: { active: true },
    create: { name: "UEFA Nations League 2026/27", active: true }
  });

  for (const fixture of romaniaNationsLeagueFixtures) {
    await prisma.match.upsert({
      where: { externalId: fixture.externalId },
      update: {
        competition: fixture.competition,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        kickoffAt: new Date(fixture.kickoffAt),
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null
      },
      create: {
        externalId: fixture.externalId,
        competition: fixture.competition,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        kickoffAt: new Date(fixture.kickoffAt),
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null
      }
    });
  }

  return {
    synced: romaniaNationsLeagueFixtures.length,
    fetched: romaniaNationsLeagueFixtures.length,
    endpoint: "UEFA/FRF public fixtures",
    teamId: null
  };
}
