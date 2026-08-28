-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('ACCOUNT', 'BOOKING', 'TRANSACTION', 'SYSTEM', 'AUTH');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ACCOUNT_CREATED', 'ACCOUNT_UPDATED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_DISABLED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DELETED', 'EMAIL_ADDED', 'PHONE_ADDED', 'ROLE_CHANGED', 'BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'SYSTEM_EVENT', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_SUCCESS', 'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_category_idx" ON "activities"("category");

-- CreateIndex
CREATE INDEX "activities_targetId_idx" ON "activities"("targetId");

-- CreateIndex
CREATE INDEX "activities_actorId_idx" ON "activities"("actorId");
