export const footballDataCompetitions = [
  { code: "BSA", name: "Campeonato Brasileiro Serie A" },
  { code: "ELC", name: "Championship" },
  { code: "PL", name: "Premier League" },
  { code: "CL", name: "UEFA Champions League" },
  { code: "EC", name: "European Championship" },
  { code: "FL1", name: "Ligue 1" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "DED", name: "Eredivisie" },
  { code: "PPL", name: "Primeira Liga" },
  { code: "CLI", name: "Copa Libertadores" },
  { code: "PD", name: "Primera Division" },
  { code: "WC", name: "FIFA World Cup" }
] as const;

export const verifiedFixtureCompetitions = [
  {
    code: "UNL_ROMANIA_2026",
    name: "UEFA Nations League 2026/27 - Romania",
    label: "UEFA Nations League 2026/27 - Romania"
  }
] as const;

export const syncCompetitions = [
  ...verifiedFixtureCompetitions,
  ...footballDataCompetitions.map((competition) => ({
    code: competition.code,
    name: competition.name,
    label: `${competition.code} | ${competition.name}`
  }))
] as const;

export const manualMatchCompetitions = [
  { value: "UEFA Nations League 2026/27", label: "UEFA Nations League 2026/27" },
  { value: "EURO Qualification", label: "EURO Qualification" },
  { value: "Calificari EURO", label: "Calificari EURO" },
  ...footballDataCompetitions.map((competition) => ({
    value: `${competition.code} | ${competition.name}`,
    label: `${competition.code} | ${competition.name}`
  }))
] as const;

export function competitionLabel(code: string, fallback = code) {
  const competition = footballDataCompetitions.find((item) => item.code === code);
  return competition ? `${competition.code} | ${competition.name}` : fallback;
}
