# Predict League

A private football score prediction app for Romania EURO qualification matches.

## Scoring

- Exact score: 4 points
- Correct winner and goal difference: 3 points
- Correct winner: 2 points
- Wrong result: 0 points

Predictions can be created or changed until kickoff. Once kickoff time passes, they are locked permanently.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and sign in with the admin username/password from `.env`.

Default local admin:

- Username: `admin`
- Password: `change-me`

## Free hosting

Use a free Next.js host such as Vercel, plus a free hosted Postgres database such as Supabase or Neon.

Set these environment variables in the host:

- `DATABASE_URL`: hosted Postgres connection string
- `SESSION_SECRET`: long random string
- `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_PASSWORD`: first admin seed values
- `SYNC_SECRET`: private token used to call the sync endpoint
- `FOOTBALL_DATA_API_KEY`: football-data.org token used by sync
- `FOOTBALL_DATA_TEAM_ID`: optional football-data.org Romania team id; if blank, the app discovers it from `EC`
- `FOOTBALL_DATA_COMPETITION_CODE`: defaults to `EC`; used when no team id is set

For Postgres, change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, then run:

```bash
npm run db:push
npm run db:seed
```

## Fixture sync API recommendation

The app currently uses `football-data.org` because its match endpoints are simple and suitable for syncing Romania fixtures/results into a small friends league.

The available competitions returned by the configured token are exposed in the admin match form as a competition dropdown: `BSA`, `ELC`, `PL`, `CL`, `EC`, `FL1`, `BL1`, `SA`, `DED`, `PPL`, `CLI`, `PD`, and `WC`.

Recommended setup:

- Create a free token at `football-data.org`.
- Set `FOOTBALL_DATA_API_KEY`.
- `FOOTBALL_DATA_TEAM_ID` can stay blank. The app discovers Romania from the configured competition code, defaults to `EC`, then syncs that team's matches.

Alternatives researched:

- `football-data.org`: best first choice for this app; straightforward competition/team/match resources and a free tier for lightweight use.
- `API-FOOTBALL` by API-SPORTS: stronger coverage and richer match/event data, but more setup and provider-specific league/team ids.
- `Sportmonks`: very complete football data, including fixtures by date range/team and updated fixture endpoints, but more commercial/productized.

The top banner image is generated artwork, not official player photography.

## Manual sync

After setting the sync environment variables, admins can click `Sincronizeaza meciurile Romaniei` in `/admin`.

You can also call:

```bash
curl -X POST "https://your-domain.example/api/sync/romania" -H "x-sync-secret: $SYNC_SECRET"
```

You can also add and edit matches manually from `/admin`.
