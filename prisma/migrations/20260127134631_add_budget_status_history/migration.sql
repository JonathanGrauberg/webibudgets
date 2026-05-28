-- AlterEnum
ALTER TYPE "BudgetStatus" ADD VALUE 'expired';

-- CreateTable
CREATE TABLE "BudgetStatusHistory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "from" "BudgetStatus" NOT NULL,
    "to" "BudgetStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT,

    CONSTRAINT "BudgetStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BudgetStatusHistory" ADD CONSTRAINT "BudgetStatusHistory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
