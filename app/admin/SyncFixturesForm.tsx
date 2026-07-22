"use client";

import { RefreshCw } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { syncCompetitions } from "@/lib/competitions";
import { syncRomaniaFixturesAction } from "../actions";

function SyncButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      <RefreshCw size={18} />
      {pending ? "Se sincronizeaza" : "Sincronizeaza meciurile Romaniei"}
    </button>
  );
}

export function SyncFixturesForm() {
  const [state, action] = useFormState(syncRomaniaFixturesAction, null);

  return (
    <form action={action} className="stack">
      <div className="field">
        <label htmlFor="sync-competition">Competitie</label>
        <select id="sync-competition" name="competitionCode" defaultValue="UNL_ROMANIA_2026">
          {syncCompetitions.map((competition) => (
            <option key={competition.code} value={competition.code}>
              {competition.label}
            </option>
          ))}
        </select>
      </div>
      <SyncButton />
      {state?.message ? (
        <p className={state.ok ? "notice notice-ok" : "notice notice-error"}>{state.message}</p>
      ) : null}
    </form>
  );
}
