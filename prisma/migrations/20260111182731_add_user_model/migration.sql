-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
