-- CreateEnum
CREATE TYPE "UploadCategory" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOC');

-- CreateEnum
CREATE TYPE "StorageDriver" AS ENUM ('LOCAL', 'CLOUDINARY');

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driver" "StorageDriver" NOT NULL,
    "category" "UploadCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "identifier" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "format" TEXT,
    "size" INTEGER,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- CreateIndex
CREATE INDEX "Upload_identifier_idx" ON "Upload"("identifier");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
