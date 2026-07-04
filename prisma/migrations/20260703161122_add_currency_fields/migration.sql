-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS';

-- AlterTable
ALTER TABLE "ProductService" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS';
