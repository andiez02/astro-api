/*
  Warnings:

  - You are about to drop the column `created_at` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `is_listed` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `nfts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `nonce` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_address` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractAddress,tokenId]` on the table `nfts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chainId` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionId` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractAddress` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorAddress` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataUri` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerAddress` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenId` to the `nfts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "nfts" DROP CONSTRAINT "nfts_owner_id_fkey";

-- DropIndex
DROP INDEX "nfts_is_listed_idx";

-- DropIndex
DROP INDEX "nfts_owner_id_idx";

-- DropIndex
DROP INDEX "users_wallet_address_key";

-- AlterTable
ALTER TABLE "nfts" DROP COLUMN "created_at",
DROP COLUMN "image_url",
DROP COLUMN "is_listed",
DROP COLUMN "owner_id",
DROP COLUMN "price",
DROP COLUMN "title",
ADD COLUMN     "chainId" INTEGER NOT NULL,
ADD COLUMN     "collectionId" TEXT NOT NULL,
ADD COLUMN     "contractAddress" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creatorAddress" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "metadataUri" TEXT NOT NULL,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "ownerAddress" TEXT NOT NULL,
ADD COLUMN     "tokenId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "nonce",
DROP COLUMN "updated_at",
DROP COLUMN "wallet_address",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "wallets" (
    "address" TEXT NOT NULL,
    "userId" TEXT,
    "nonce" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "standard" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "royaltyFee" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editions" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edition_balances" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "edition_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drops" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "tokenId" TEXT,
    "price" DECIMAL(36,18) NOT NULL,
    "maxSupply" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_contractAddress_key" ON "collections"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "editions_contractAddress_tokenId_key" ON "editions"("contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "edition_balances_editionId_owner_key" ON "edition_balances"("editionId", "owner");

-- CreateIndex
CREATE INDEX "listings_contractAddress_tokenId_idx" ON "listings"("contractAddress", "tokenId");

-- CreateIndex
CREATE INDEX "nfts_ownerAddress_idx" ON "nfts"("ownerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "nfts_contractAddress_tokenId_key" ON "nfts"("contractAddress", "tokenId");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editions" ADD CONSTRAINT "editions_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edition_balances" ADD CONSTRAINT "edition_balances_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
