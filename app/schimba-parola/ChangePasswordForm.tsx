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
        <h1>Schimba user sau parola</h1>
        <p className="muted">Completeaza doar ce vrei sa modifici.</p>
      </div>
      <div className="field">
        <label htmlFor="username">Username nou</label>
        <input id="username" name="username" autoComplete="username" pattern="[A-Za-z0-9_-]+" minLength={2} maxLength={32} />
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
      {state?.message ? (
        <p className={state.ok ? "notice notice-ok" : "notice notice-error"}>{state.message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
