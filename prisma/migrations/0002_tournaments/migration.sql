-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_key" ON "Tournament"("name");

-- Seed tournaments from existing matches. Nations League starts active; everything else starts inactive.
INSERT INTO "Tournament" ("id", "name", "active", "createdAt", "updatedAt")
SELECT
    'tournament-' || lower(replace(replace(replace("competition", ' ', '-'), '/', '-'), '|', '-')),
    "competition",
    CASE WHEN "competition" = 'UEFA Nations League 2026/27' THEN true ELSE false END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Match"
GROUP BY "competition";
