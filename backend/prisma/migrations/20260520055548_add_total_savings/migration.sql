-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableBalance" REAL NOT NULL DEFAULT 0,
    "totalSavings" REAL NOT NULL DEFAULT 0,
    "monthlyBudget" REAL NOT NULL DEFAULT 0,
    "monthlySpent" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("availableBalance", "date", "email", "id", "monthlyBudget", "monthlySpent", "name", "password") SELECT "availableBalance", "date", "email", "id", "monthlyBudget", "monthlySpent", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
