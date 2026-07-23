import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Trophy } from "lucide-react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { FeaturesButton } from "@/components/FeaturesButton";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Pronosticuri cu baietii",
  description: "Pronosticuri private pentru meciurile Romaniei"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ro">
      <body>
        <div className="shell">
          {user ? (
            <header className="topbar">
              <Link className="brand" href="/">
                <Trophy size={24} />
                Pronosticuri cu baietii
              </Link>
              <nav className="nav">
                <span className="user-greeting">Salut, {user.name || user.username}</span>
                {user.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
                <Link href="/schimba-parola">
                  <KeyRound size={16} />
                  Schimba nume/parola
                </Link>
                <FeaturesButton />
                <form action={logoutAction}>
                  <button type="submit">Iesire</button>
                </form>
              </nav>
            </header>
          ) : null}
          {children}
        </div>
      </body>
    </html>
  );
}
