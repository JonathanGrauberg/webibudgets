-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "maxUsers" INTEGER DEFAULT 5,
ADD COLUMN     "plan" TEXT DEFAULT 'free';
