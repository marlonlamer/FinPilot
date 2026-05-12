-- Add history column to Savings (JSON stored as TEXT in SQLite)
ALTER TABLE "Savings" ADD COLUMN "history" TEXT;
