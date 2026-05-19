-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavingsTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "savingsId" INTEGER,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavingsTransaction_savingsId_fkey" FOREIGN KEY ("savingsId") REFERENCES "Savings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavingsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SavingsTransaction" ("amount", "date", "id", "note", "savingsId", "type", "userId") SELECT "amount", "date", "id", "note", "savingsId", "type", "userId" FROM "SavingsTransaction";
DROP TABLE "SavingsTransaction";
ALTER TABLE "new_SavingsTransaction" RENAME TO "SavingsTransaction";
CREATE INDEX "SavingsTransaction_userId_idx" ON "SavingsTransaction"("userId");
CREATE INDEX "SavingsTransaction_savingsId_idx" ON "SavingsTransaction"("savingsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
