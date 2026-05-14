-- CreateTable
CREATE TABLE "SavingsTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "savingsId" INTEGER,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavingsTransaction_savingsId_fkey" FOREIGN KEY ("savingsId") REFERENCES "Savings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SavingsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SavingsTransaction_userId_idx" ON "SavingsTransaction"("userId");

-- CreateIndex
CREATE INDEX "SavingsTransaction_savingsId_idx" ON "SavingsTransaction"("savingsId");
