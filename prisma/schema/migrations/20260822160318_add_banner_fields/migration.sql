/*
  Warnings:

  - You are about to drop the column `avatarPath` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bannerPath` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "avatarPath",
DROP COLUMN "bannerPath",
ADD COLUMN     "avatar_path" TEXT,
ADD COLUMN     "banner_path" TEXT;
