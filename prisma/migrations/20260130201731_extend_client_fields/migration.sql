-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('home', 'permanent_use', 'hall', 'sanitary', 'company');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('prospect', 'active', 'inactive');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "peopleCount" INTEGER,
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'prospect',
ADD COLUMN     "type" "ClientType",
ADD COLUMN     "usageFrequency" TEXT;
