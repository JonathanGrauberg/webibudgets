-- DropForeignKey
ALTER TABLE "BudgetItem" DROP CONSTRAINT "BudgetItem_productServiceId_fkey";

-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "customName" TEXT,
ALTER COLUMN "productServiceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
