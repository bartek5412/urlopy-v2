-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leave_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_email" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
INSERT INTO "new_leave_requests" ("created_at", "description", "employee_email", "end_date", "id", "start_date", "status") SELECT "created_at", "description", "employee_email", "end_date", "id", "start_date", "status" FROM "leave_requests";
DROP TABLE "leave_requests";
ALTER TABLE "new_leave_requests" RENAME TO "leave_requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
