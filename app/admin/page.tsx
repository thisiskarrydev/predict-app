import { redirect } from "next/navigation";
import { Plus, Trash2, UserX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { footballDataCompetitions, manualMatchCompetitions } from "@/lib/competitions";
import { prisma } from "@/lib/prisma";
import {
  createTournamentAction,
  createUserAction,
  deleteMatchAction,
  deleteUserAction,
  toggleTournamentAction,
  toggleUserAction,
  upsertMatchAction
} from "../actions";
import { SyncFixturesForm } from "./SyncFixturesForm";

function dateTimeValue(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function competitionValue(value: string) {
  const match = footballDataCompetitions.find((competition) => {
    return value === competition.code || value === competition.name || value === `${competition.code} | ${competition.name}`;
  });
  return match ? `${match.code} | ${match.name}` : value;
}

function CompetitionSelect({ defaultValue, tournaments }: { defaultValue: string; tournaments: { name: string }[] }) {
  const selectedValue = competitionValue(defaultValue);
  const configuredCompetitions = [
    ...tournaments.map((tournament) => ({ value: tournament.name, label: tournament.name })),
    ...manualMatchCompetitions
  ].filter((competition, index, list) => {
    return list.findIndex((item) => item.value === competition.value) === index;
  });
  const hasCustomValue = !configuredCompetitions.some((competition) => competition.value === selectedValue);

  return (
    <select name="competition" defaultValue={selectedValue} required>
      {configuredCompetitions.map((competition) => (
        <option key={competition.value} value={competition.value}>
          {competition.label}
        </option>
      ))}
      {hasCustomValue ? <option value={selectedValue}>{selectedValue}</option> : null}
    </select>
  );
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [users, matches, tournaments] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.match.findMany({ orderBy: { kickoffAt: "asc" } }),
    prisma.tournament.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] })
  ]);

  return (
    <main className="content">
      <h1>Admin</h1>
      <section className="panel" style={{ marginBottom: 20 }}>
        <h2>Sincronizare meciuri</h2>
        <p className="muted">
          Importa meciurile Romaniei. Nations League foloseste programul public UEFA/FRF, iar celelalte competitii
          folosesc football-data.org cand tokenul are acces.
        </p>
        <SyncFixturesForm />
      </section>
      <div className="admin-grid">
        <section className="panel">
          <h2>Adauga baiat</h2>
          <form className="stack" action={createUserAction}>
            <div className="field">
              <label>Nume</label>
              <input name="name" required />
            </div>
            <div className="field">
              <label>Nume de utilizator</label>
              <input name="username" pattern="[A-Za-z0-9_-]+" required />
            </div>
            <div className="field">
              <label>Parola temporara</label>
              <input name="password" type="password" minLength={8} required />
            </div>
            <div className="field">
              <label>Role</label>
              <select name="role" defaultValue="USER">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="button" type="submit">
              <Plus size={18} /> Creeaza user
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Useri</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Utilizator</th>
                <th>Role</th>
                <th>Stare</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.name}</td>
                  <td>@{entry.username}</td>
                  <td>{entry.role}</td>
                  <td>{entry.active ? "Activ" : "Dezactivat"}</td>
                  <td>
                    <form action={toggleUserAction} style={{ display: "inline" }}>
                      <input type="hidden" name="userId" value={entry.id} />
                      <button className="button" type="submit" title="Toggle user">
                        <UserX size={16} />
                      </button>
                    </form>{" "}
                    <form action={deleteUserAction} style={{ display: "inline" }}>
                      <input type="hidden" name="userId" value={entry.id} />
                      <button className="button danger" type="submit" title="Delete user">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Turnee</h2>
        <p className="muted">Doar turneele active apar pe pagina principala si in selectorul de clasament.</p>
        <form className="prediction-form" action={createTournamentAction}>
          <div className="field">
            <label>Nume turneu</label>
            <input name="name" defaultValue="UEFA Nations League 2026/27" required />
          </div>
          <label className="inline-check">
            <input name="active" type="checkbox" /> Activ
          </label>
          <button className="button" type="submit">
            <Plus size={18} /> Salveaza turneu
          </button>
        </form>
        <table className="table compact-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Turneu</th>
              <th>Stare</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((tournament) => (
              <tr key={tournament.id}>
                <td>{tournament.name}</td>
                <td>{tournament.active ? "Activ" : "Inactiv"}</td>
                <td>
                  <form action={toggleTournamentAction}>
                    <input type="hidden" name="tournamentId" value={tournament.id} />
                    <button className="button" type="submit">
                      {tournament.active ? "Dezactiveaza" : "Activeaza"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Adauga meci</h2>
        <form className="prediction-form" action={upsertMatchAction}>
          <div className="field">
            <label>Competitie</label>
            <CompetitionSelect defaultValue="UEFA Nations League 2026/27" tournaments={tournaments} />
          </div>
          <div className="field">
            <label>Acasa</label>
            <input name="homeTeam" defaultValue="Romania" required />
          </div>
          <div className="field">
            <label>Deplasare</label>
            <input name="awayTeam" required />
          </div>
          <div className="field">
            <label>Ora meciului</label>
            <input name="kickoffAt" type="datetime-local" required />
          </div>
          <input type="hidden" name="status" value="SCHEDULED" />
          <button className="button" type="submit">
            <Plus size={18} /> Adauga meci
          </button>
        </form>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Meciuri si rezultate</h2>
        <div className="admin-match-list">
          {matches.map((match) => (
            <details className="admin-match-row" key={match.id}>
              <summary className="admin-match-summary">
                <div>
                  <strong>{match.homeTeam} vs {match.awayTeam}</strong>
                  <span>{match.competition}</span>
                </div>
                <span className={`badge ${match.status === "FINISHED" ? "badge-score" : match.status === "SCHEDULED" ? "badge-open" : "badge-locked"}`}>
                  {match.status === "SCHEDULED" ? "Programat" : match.status === "FINISHED" ? "Terminat" : match.status}
                </span>
              </summary>
              <form className="admin-match-fields" action={upsertMatchAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <div className="field wide-field">
                  <label>Competitie</label>
                  <CompetitionSelect defaultValue={match.competition} tournaments={tournaments} />
                </div>
                <div className="field">
                  <label>Acasa</label>
                  <input name="homeTeam" defaultValue={match.homeTeam} required />
                </div>
                <div className="field">
                  <label>Deplasare</label>
                  <input name="awayTeam" defaultValue={match.awayTeam} required />
                </div>
                <div className="field">
                  <label>Ora meciului</label>
                  <input name="kickoffAt" type="datetime-local" defaultValue={dateTimeValue(match.kickoffAt)} required />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status" defaultValue={match.status}>
                    <option value="SCHEDULED">Programat</option>
                    <option value="LIVE">In desfasurare</option>
                    <option value="FINISHED">Terminat</option>
                    <option value="CANCELLED">Anulat</option>
                  </select>
                </div>
                <div className="field">
                  <label>Goluri acasa</label>
                  <input className="score-input" name="homeScore" type="number" min="0" max="30" defaultValue={match.homeScore ?? ""} />
                </div>
                <div className="field">
                  <label>Goluri deplasare</label>
                  <input className="score-input" name="awayScore" type="number" min="0" max="30" defaultValue={match.awayScore ?? ""} />
                </div>
                <div className="admin-match-actions">
                  <button className="button" type="submit">Salveaza</button>
                  <button className="button danger" formAction={deleteMatchAction} type="submit">
                    <Trash2 size={16} />
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
