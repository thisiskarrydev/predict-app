import { prisma } from "./prisma";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  competition: { name: string };
  homeTeam: { name: string; tla?: string };
  awayTeam: { name: string; tla?: string };
  score: { fullTime: { home: number | null; away: number | null } };
};

export type SyncResult = {
  synced: number;
  fetched: number;
  endpoint: string;
  teamId: string | null;
};

type FootballDataTeam = {
  id: number;
  name: string;
  tla?: string;
  shortName?: string;
};

class FootballDataError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null
  ) {
    super(message);
  }
}

function mapStatus(status: string) {
  if (status === "FINISHED") return "FINISHED";
  if (status === "IN_PLAY" || status === "PAUSED") return "LIVE";
  if (status === "CANCELLED" || status === "POSTPONED") return "CANCELLED";
  return "SCHEDULED";
}

async function footballDataFetch(path: string, apiKey: string) {
  const response = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new FootballDataError(`football-data.org a raspuns cu ${response.status}. ${detail.slice(0, 180)}`, response.status);
  }

  return response;
}

async function discoverRomaniaTeamId(apiKey: string, competitionCode: string) {
  const response = await footballDataFetch(`/competitions/${competitionCode}/teams`, apiKey);
  const payload = (await response.json()) as { teams?: FootballDataTeam[] };
  const team = payload.teams?.find((item) => {
    return item.tla === "ROU" || /romania|românia/i.test(item.name) || /romania|românia/i.test(item.shortName ?? "");
  });

  return team?.id ? String(team.id) : null;
}

export async function syncRomaniaFixtures(selectedCompetitionCode?: string) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();
  const configuredTeamId = process.env.FOOTBALL_DATA_TEAM_ID?.trim();
  const competitionCode = selectedCompetitionCode?.trim() || process.env.FOOTBALL_DATA_COMPETITION_CODE?.trim() || "EC";

  if (!apiKey) {
    throw new Error("Lipseste FOOTBALL_DATA_API_KEY. Creeaza un token pe football-data.org si adauga-l in .env.");
  }

  const discoveredTeamId = configuredTeamId || (await discoverRomaniaTeamId(apiKey, competitionCode));
  if (!discoveredTeamId) {
    throw new Error(
      `Nu am gasit Romania in competitia ${competitionCode}. Seteaza manual FOOTBALL_DATA_TEAM_ID sau verifica accesul tokenului.`
    );
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 14);
  const to = new Date(now);
  to.setDate(to.getDate() + 730);
  const dateFrom = from.toISOString().slice(0, 10);
  const dateTo = to.toISOString().slice(0, 10);
  const statuses = "SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED";
  const teamEndpointPath = `/teams/${discoveredTeamId}/matches?status=${statuses}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const competitionEndpointPath = `/competitions/${competitionCode}/matches?status=${statuses}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  let endpointPath = teamEndpointPath;
  let response: Response;

  try {
    response = await footballDataFetch(teamEndpointPath, apiKey);
  } catch (error) {
    if (error instanceof FootballDataError && error.status === 403) {
      endpointPath = competitionEndpointPath;
      response = await footballDataFetch(competitionEndpointPath, apiKey);
    } else {
      throw error;
    }
  }
  const endpoint = `https://api.football-data.org/v4${endpointPath}`;

  const payload = (await response.json()) as { matches: FootballDataMatch[] };
  const matches = payload.matches ?? [];
  const filtered = matches.filter((match) => {
    const hasRomania =
      match.homeTeam.tla === "ROU" ||
      match.awayTeam.tla === "ROU" ||
      /romania|românia/i.test(match.homeTeam.name) ||
      /romania|românia/i.test(match.awayTeam.name);
    const looksRelevant = /euro|european|qualification|qualifiers|championship/i.test(match.competition.name);
    return hasRomania && looksRelevant;
  });

  for (const match of filtered) {
    const status = mapStatus(match.status);
    await prisma.tournament.upsert({
      where: { name: match.competition.name },
      update: {},
      create: { name: match.competition.name, active: false }
    });

    await prisma.match.upsert({
      where: { externalId: `football-data:${match.id}` },
      update: {
        competition: match.competition.name,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        kickoffAt: new Date(match.utcDate),
        status,
        homeScore: status === "FINISHED" ? match.score.fullTime.home : null,
        awayScore: status === "FINISHED" ? match.score.fullTime.away : null
      },
      create: {
        externalId: `football-data:${match.id}`,
        competition: match.competition.name,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        kickoffAt: new Date(match.utcDate),
        status,
        homeScore: status === "FINISHED" ? match.score.fullTime.home : null,
        awayScore: status === "FINISHED" ? match.score.fullTime.away : null
      }
    });
  }

  return { synced: filtered.length, fetched: matches.length, endpoint, teamId: discoveredTeamId } satisfies SyncResult;
}
