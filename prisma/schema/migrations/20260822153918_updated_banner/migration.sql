/*
  Warnings:

  - You are about to drop the column `bannerThumbnailUrl` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bannerUrl` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "bannerThumbnailUrl",
DROP COLUMN "bannerUrl",
ADD COLUMN     "banner_thumbnail_url" TEXT,
ADD COLUMN     "banner_url" TEXT;
