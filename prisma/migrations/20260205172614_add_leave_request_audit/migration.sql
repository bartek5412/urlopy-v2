/*
  Warnings:

  - You are about to alter the column `created_at` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leave_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_email" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" DATETIME,
    "cancelled_by" INTEGER,
    "edited_at" DATETIME,
    "edited_by" INTEGER,
    "accepted_at" DATETIME,
    "accepted_by" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "google_calendar_event_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leave_requests_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leave_requests" ("created_at", "description", "employee_email", "end_date", "google_calendar_event_id", "id", "start_date", "status") SELECT "created_at", "description", "employee_email", "end_date", "google_calendar_event_id", "id", "start_date", "status" FROM "leave_requests";
DROP TABLE "leave_requests";
ALTER TABLE "new_leave_requests" RENAME TO "leave_requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
