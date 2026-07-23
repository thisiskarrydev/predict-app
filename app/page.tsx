import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, Lock, Save, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pointsForPrediction } from "@/lib/scoring";
import { savePredictionAction } from "./actions";
import { PredictionsModal } from "./PredictionsModal";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest"
  }).format(date);
}

const teamFlags: Record<string, { flag: string; code: string }> = {
  "bosnia si hertegovina": { flag: "🇧🇦", code: "BOS" },
  "bosnia and herzegovina": { flag: "🇧🇦", code: "BOS" },
  polonia: { flag: "🇵🇱", code: "POL" },
  poland: { flag: "🇵🇱", code: "POL" },
  romania: { flag: "🇷🇴", code: "ROM" },
  "românia": { flag: "🇷🇴", code: "ROM" },
  suedia: { flag: "🇸🇪", code: "SUE" },
  sweden: { flag: "🇸🇪", code: "SUE" }
};

const defaultLeaderboardCompetition = "UEFA Nations League 2026/27";

function teamDisplay(teamName: string) {
  const normalized = teamName.trim().toLowerCase();
  return teamFlags[normalized] ?? { flag: "🏳️", code: teamName };
}

export default async function HomePage({ searchParams }: { searchParams?: { competitie?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [activeTournaments, users] = await Promise.all([
    prisma.tournament.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.user.findMany({
      where: { active: true },
      include: { predictions: { include: { match: true } } },
      orderBy: { name: "asc" }
    })
  ]);
  const activeCompetitionNames = activeTournaments.map((tournament) => tournament.name);
  const matches = activeCompetitionNames.length
    ? await prisma.match.findMany({
        where: { competition: { in: activeCompetitionNames } },
        orderBy: { kickoffAt: "asc" },
        include: { predictions: { include: { user: true } } }
      })
    : [];

  const leaderboardUsers = users.filter((entry) => entry.name.trim().toLowerCase() !== "admin");
  const competitions = activeCompetitionNames;
  const requestedCompetition = searchParams?.competitie;
  const selectedCompetition = competitions.includes(requestedCompetition ?? "")
    ? requestedCompetition!
    : competitions.includes(defaultLeaderboardCompetition)
      ? defaultLeaderboardCompetition
      : competitions[0];
  const now = new Date();
  const nextLeaderboardMatch = selectedCompetition
    ? matches.find((match) => match.competition === selectedCompetition && match.kickoffAt > now)
    : null;
  const leaderboard = selectedCompetition
    ? leaderboardUsers
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          hasNextPrediction: nextLeaderboardMatch
            ? entry.predictions.some((prediction) => prediction.matchId === nextLeaderboardMatch.id)
            : null,
          points: entry.predictions.reduce((sum, prediction) => {
            if (prediction.match.competition !== selectedCompetition) return sum;
            return sum + pointsForPrediction(prediction.match, prediction);
          }, 0)
        }))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    : [];

  return (
    <main>
      <div className="content grid">
        <section>
          <div className="legend">
            <span>Scor corect <strong>4p</strong></span>
            <span>Diferenta de goluri + echipa castigatoare <strong>3p</strong></span>
            <span>Echipa castigatoare <strong>2p</strong></span>
          </div>

          {matches.length === 0 ? (
            <div className="panel">
              <h2>Nu exista meciuri inca</h2>
              <p className="muted">Un admin poate sincroniza sau adauga meciurile Romaniei.</p>
            </div>
          ) : null}

          <div className="match-list">
            {matches.map((match) => {
              const prediction = match.predictions.find((item) => item.userId === user.id);
              const locked = match.kickoffAt <= new Date() || match.status !== "SCHEDULED";
              const points = prediction ? pointsForPrediction(match, prediction) : 0;
              const statusClass = prediction ? (locked ? "marker marker-locked" : "marker marker-set") : "marker marker-empty";
              const result =
                match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null
                  ? `${match.homeScore}-${match.awayScore}`
                  : null;
              const homeTeam = teamDisplay(match.homeTeam);
              const awayTeam = teamDisplay(match.awayTeam);
              const predictionRows = leaderboardUsers.map((entry) => {
                const userPrediction = match.predictions.find((item) => item.userId === entry.id);
                return {
                  name: entry.name,
                  prediction: userPrediction ? `${userPrediction.homeGoals}-${userPrediction.awayGoals}` : null,
                  points:
                    userPrediction && match.status === "FINISHED"
                      ? pointsForPrediction(match, userPrediction)
                      : null
                };
              });

              return (
                <article className="match" key={match.id}>
                  <div className="match-main">
                    <div className="match-tag">{match.competition}</div>
                    <div className="teams" aria-label={`${match.homeTeam} vs ${match.awayTeam}`}>
                      <span className="team-flag" title={match.homeTeam}>
                        <span aria-hidden="true">{homeTeam.flag}</span>
                        <span>{homeTeam.code}</span>
                      </span>
                      <span className="versus">vs</span>
                      <span className="team-flag" title={match.awayTeam}>
                        <span aria-hidden="true">{awayTeam.flag}</span>
                        <span>{awayTeam.code}</span>
                      </span>
                    </div>
                    <div className="meta">
                      <CalendarClock size={13} /> {formatDate(match.kickoffAt)}
                    </div>
                  </div>

                  <div className="prediction-status">
                    <span className={statusClass}>
                      {prediction ? (locked ? <Lock size={13} /> : <CheckCircle2 size={13} />) : null}
                    </span>
                    <strong>
                      {prediction
                        ? `${locked ? "Blocat" : "Setat"}: ${prediction.homeGoals}-${prediction.awayGoals}${locked ? ` · ${points}p` : ""}`
                        : "Fara predictie"}
                    </strong>
                  </div>

                  <div className="match-action">
                    {locked ? (
                      <div className="locked-actions">
                        <span className={`badge ${result ? "badge-score" : "badge-locked"}`}>
                          {result ?? "Blocat"}
                        </span>
                        <PredictionsModal
                          matchLabel={`${match.homeTeam} vs ${match.awayTeam}`}
                          rows={predictionRows}
                        />
                      </div>
                    ) : prediction ? (
                      <details className="edit-prediction">
                        <summary className="button compact-button secondary-button">Modifica</summary>
                        <form className="prediction-form compact-pick" action={savePredictionAction}>
                          <input type="hidden" name="matchId" value={match.id} />
                          <label className="visually-hidden" htmlFor={`home-${match.id}`}>
                            {match.homeTeam}
                          </label>
                          <input
                            className="score-input"
                            id={`home-${match.id}`}
                            name="homeGoals"
                            type="number"
                            min="0"
                            max="30"
                            defaultValue={prediction.homeGoals}
                            required
                          />
                          <span className="score-separator">-</span>
                          <label className="visually-hidden" htmlFor={`away-${match.id}`}>
                            {match.awayTeam}
                          </label>
                          <input
                            className="score-input"
                            id={`away-${match.id}`}
                            name="awayGoals"
                            type="number"
                            min="0"
                            max="30"
                            defaultValue={prediction.awayGoals}
                            required
                          />
                          <button className="button compact-button" type="submit">
                            <Save size={16} /> Salveaza
                          </button>
                        </form>
                      </details>
                    ) : (
                      <form className="prediction-form compact-pick" action={savePredictionAction}>
                        <input type="hidden" name="matchId" value={match.id} />
                        <label className="visually-hidden" htmlFor={`home-${match.id}`}>
                          {match.homeTeam}
                        </label>
                        <input
                          className="score-input"
                          id={`home-${match.id}`}
                          name="homeGoals"
                          type="number"
                          min="0"
                          max="30"
                          defaultValue={1}
                          required
                        />
                        <span className="score-separator">-</span>
                        <label className="visually-hidden" htmlFor={`away-${match.id}`}>
                          {match.awayTeam}
                        </label>
                        <input
                          className="score-input"
                          id={`away-${match.id}`}
                          name="awayGoals"
                          type="number"
                          min="0"
                          max="30"
                          defaultValue={0}
                          required
                        />
                        <button className="button compact-button" type="submit">
                          <Save size={16} /> Seteaza
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel leaderboard-panel">
            <div className="leaderboard-title">
              <h2>Clasament</h2>
              <Trophy className="title-icon" size={22} />
            </div>
            {competitions.length === 0 ? <p className="muted">Nu exista competitii inca.</p> : null}
            {selectedCompetition ? (
              <div className="leaderboard-list">
                <form className="leaderboard-filter" action="/" method="get">
                  <label htmlFor="leaderboard-competition">Turneu</label>
                  <select id="leaderboard-competition" name="competitie" defaultValue={selectedCompetition}>
                    {competitions.map((competition) => (
                      <option key={competition} value={competition}>
                        {competition}
                      </option>
                    ))}
                  </select>
                  <button className="button compact-button" type="submit">
                    Afiseaza
                  </button>
                </form>
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Baiat</th>
                      <th>Urmatorul</th>
                      <th>Pct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td>{entry.name}</td>
                        <td>
                          {entry.hasNextPrediction === null ? (
                            <span className="prediction-pill prediction-pill-muted">-</span>
                          ) : entry.hasNextPrediction ? (
                            <span className="prediction-pill prediction-pill-set">Pus</span>
                          ) : (
                            <span className="prediction-pill prediction-pill-missing">Lipsa</span>
                          )}
                        </td>
                        <td>{entry.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
