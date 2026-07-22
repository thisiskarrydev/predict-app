# Deploy online

Recomandare: Vercel pentru aplicatia Next.js si Neon pentru baza de date Postgres.

## 1. GitHub remote

Daca ai facut deja `git init`, `git add .` si `git commit`, mai trebuie sa creezi un repo pe GitHub si sa faci push:

```bash
git remote add origin https://github.com/USERNAME/predict-app.git
git push -u origin master
```

Daca GitHub iti creeaza branch-ul default `main`, foloseste:

```bash
git branch -M main
git push -u origin main
```

## 2. Neon database

1. Intra pe https://neon.com.
2. Creeaza un proiect nou.
3. Copiaza connection string-ul Postgres.
4. Inlocuieste `DATABASE_URL` din `.env` local cu connection string-ul Neon.

## 3. Prisma pentru Postgres

In `prisma/schema.prisma`, schimba datasource-ul din SQLite in Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Apoi creeaza tabelele in Neon:

```bash
npx prisma db push
npm run db:seed
```

## 4. Vercel

1. Intra pe https://vercel.com.
2. Creeaza `Add New Project`.
3. Importa repo-ul din GitHub.
4. La Environment Variables adauga valorile din `.env.example`, cu valorile reale.
5. Deploy.

Variabile obligatorii:

```bash
DATABASE_URL
SESSION_SECRET
INITIAL_ADMIN_USERNAME
INITIAL_ADMIN_NAME
INITIAL_ADMIN_PASSWORD
FOOTBALL_DATA_API_KEY
FOOTBALL_DATA_TEAM_ID
FOOTBALL_DATA_COMPETITION_CODE
SYNC_SECRET
```

## 5. Dupa deploy

Intra pe URL-ul Vercel, logheaza-te cu adminul initial si verifica:

- `/admin`
- `Turnee`
- `Meciuri si rezultate`
- userii prietenilor

## Important

Nu urca niciodata `.env` pe GitHub. Fisierul este deja in `.gitignore`.
