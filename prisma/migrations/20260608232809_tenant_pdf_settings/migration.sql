/*
  Warnings:

  - You are about to drop the column `siteDetails` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `technicalDetails` on the `Budget` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Installer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Seller` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "siteDetails",
DROP COLUMN "technicalDetails",
ADD COLUMN     "budgetNumber" INTEGER,
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "Installer" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "budgetSequence" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredTheme" TEXT DEFAULT 'system',
ADD COLUMN     "showFooterBranding" BOOLEAN DEFAULT false,
ADD COLUMN     "showPageNumbers" BOOLEAN DEFAULT true,
ADD COLUMN     "showWebsiteInPdf" BOOLEAN DEFAULT true,
ADD COLUMN     "watermarkOpacity" DOUBLE PRECISION DEFAULT 0.06,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Installer_userId_key" ON "Installer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");

-- AddForeignKey
ALTER TABLE "Installer" ADD CONSTRAINT "Installer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
