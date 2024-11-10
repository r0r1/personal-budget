-- Make recurrenceDate optional in BudgetItem table
ALTER TABLE "BudgetItem" ALTER COLUMN "recurrenceDate" DROP NOT NULL;
