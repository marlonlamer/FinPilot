-- CreateEnum
CREATE TYPE "SavingsAccountType" AS ENUM ('CASH_WALLET', 'BANK_ACCOUNT', 'E_WALLET', 'VISUAL_BANK_CARD');

-- CreateTable
CREATE TABLE "SavingsAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "SavingsAccountType" NOT NULL,
    "provider" TEXT NOT NULL,
    "maskedAccountNumber" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsAccount_userId_idx" ON "SavingsAccount"("userId");

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
