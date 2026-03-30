/*
  Warnings:

  - You are about to drop the column `buyUrl` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the `BabyList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArticleToProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BabyListArticles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BabyList" DROP CONSTRAINT "BabyList_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToProvider" DROP CONSTRAINT "_ArticleToProvider_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToProvider" DROP CONSTRAINT "_ArticleToProvider_B_fkey";

-- DropForeignKey
ALTER TABLE "_BabyListArticles" DROP CONSTRAINT "_BabyListArticles_A_fkey";

-- DropForeignKey
ALTER TABLE "_BabyListArticles" DROP CONSTRAINT "_BabyListArticles_B_fkey";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "category" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "buyUrl",
DROP COLUMN "price",
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'ES',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "websiteUrl" TEXT,
ALTER COLUMN "logoUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'ES',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "BabyList";

-- DropTable
DROP TABLE "_ArticleToProvider";

-- DropTable
DROP TABLE "_BabyListArticles";

-- CreateTable
CREATE TABLE "Baby" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "customSlug" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'ES',
    "giftRegistryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pregnancyTrackerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "birthBettingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "giftRegistrySettings" JSONB,
    "pregnancyTrackerPublic" BOOLEAN NOT NULL DEFAULT false,
    "pregnancyTrackerSettings" JSONB,
    "pregnancyStartDate" TIMESTAMP(3),
    "bettingSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BabyOwner" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',

    CONSTRAINT "BabyOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerInvitation" (
    "id" SERIAL NOT NULL,
    "babyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleProvider" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "buyUrl" TEXT,
    "location" TEXT,
    "details" TEXT,
    "imageUrl" TEXT,
    "lastScraped" TIMESTAMP(3),

    CONSTRAINT "ArticleProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" SERIAL NOT NULL,
    "babyId" TEXT NOT NULL,
    "articleId" INTEGER NOT NULL,
    "acceptSimilar" BOOLEAN NOT NULL DEFAULT false,
    "priceRangeMin" DOUBLE PRECISION,
    "priceRangeMax" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',
    "reservedByName" TEXT,
    "reservationType" TEXT,
    "providerIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" SERIAL NOT NULL,
    "babyId" TEXT NOT NULL,
    "betterName" TEXT NOT NULL,
    "betterEmail" TEXT,
    "betDate" TIMESTAMP(3) NOT NULL,
    "betDateEnd" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" SERIAL NOT NULL,
    "babyId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "methods" JSONB NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Baby_customSlug_key" ON "Baby"("customSlug");

-- CreateIndex
CREATE UNIQUE INDEX "BabyOwner_userId_babyId_key" ON "BabyOwner"("userId", "babyId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerInvitation_token_key" ON "OwnerInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleProvider_articleId_providerId_key" ON "ArticleProvider"("articleId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_babyId_betterName_key" ON "Bet"("babyId", "betterName");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfig_babyId_featureType_key" ON "PaymentConfig"("babyId", "featureType");

-- AddForeignKey
ALTER TABLE "BabyOwner" ADD CONSTRAINT "BabyOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BabyOwner" ADD CONSTRAINT "BabyOwner_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerInvitation" ADD CONSTRAINT "OwnerInvitation_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleProvider" ADD CONSTRAINT "ArticleProvider_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleProvider" ADD CONSTRAINT "ArticleProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
