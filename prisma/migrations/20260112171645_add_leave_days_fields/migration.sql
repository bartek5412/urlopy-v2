-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "leader_id" INTEGER,
    "daysAvailable" INTEGER NOT NULL DEFAULT 26,
    "daysPerYear" INTEGER NOT NULL DEFAULT 26,
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
INSERT INTO "new_users" ("created_at", "email", "id", "leader_id", "name", "password", "role") SELECT "created_at", "email", "id", "leader_id", "name", "password", "role" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
