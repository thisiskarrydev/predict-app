"use client";

import { KeyRound } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { updateAccountAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      <KeyRound size={18} />
      {pending ? "Se salveaza" : "Salveaza"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(updateAccountAction, null);

  return (
    <form action={action} className="login stack">
      <div>
        <h1>Schimba nume afisat sau parola</h1>
        <p className="muted">Username-ul de login ramane acelasi. Completeaza doar sectiunea pe care vrei sa o modifici.</p>
      </div>
      <section className="settings-section">
        <div>
          <h2>Nume afisat</h2>
          <p className="muted">Asta apare in clasament si in salutul din header. Nu schimba username-ul folosit la login.</p>
        </div>
        <div className="field">
          <label htmlFor="name">Nume afisat nou</label>
          <input id="name" name="name" autoComplete="name" minLength={2} maxLength={40} />
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Parola</h2>
          <p className="muted">Poti schimba parola fara sa completezi numele afisat.</p>
        </div>
        <div className="field">
          <label htmlFor="password">Parola noua</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirma parola</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </section>
      {state?.message ? (
        <p className={state.ok ? "notice notice-ok" : "notice notice-error"}>{state.message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
