"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { loginAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      <LogIn size={18} />
      {pending ? "Se intra" : "Intra in cont"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(loginAction, null);

  return (
    <form action={action} className="login stack">
      <div>
        <h1>Predictii cu baietii</h1>
        <p className="muted">Predictii private pentru meciurile Romaniei.</p>
      </div>
      <div className="field">
        <label htmlFor="username">Nume de utilizator</label>
        <input id="username" name="username" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Parola</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? <p className="muted">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
