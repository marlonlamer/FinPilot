-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Expense"
  ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurrenceFrequency" "RecurrenceFrequency",
  ADD COLUMN "recurrenceEndDate" DATE;

-- AlterTable
ALTER TABLE "Income"
  ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurrenceFrequency" "RecurrenceFrequency",
  ADD COLUMN "recurrenceEndDate" DATE;
