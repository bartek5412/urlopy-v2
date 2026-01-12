-- CreateTable
CREATE TABLE "leave_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_email" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
