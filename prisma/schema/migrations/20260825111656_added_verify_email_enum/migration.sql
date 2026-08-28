/*
  Warnings:

  - The values [REGISTER] on the enum `OtpPurpose` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OtpPurpose_new" AS ENUM ('LOGIN', 'PASSWORD_RESET', 'VERIFY_PHONE', 'VERIFY_EMAIL');
ALTER TABLE "public"."otp_verifications" ALTER COLUMN "purpose" DROP DEFAULT;
ALTER TABLE "otp_verifications" ALTER COLUMN "purpose" TYPE "OtpPurpose_new" USING ("purpose"::text::"OtpPurpose_new");
ALTER TYPE "OtpPurpose" RENAME TO "OtpPurpose_old";
ALTER TYPE "OtpPurpose_new" RENAME TO "OtpPurpose";
DROP TYPE "public"."OtpPurpose_old";
ALTER TABLE "otp_verifications" ALTER COLUMN "purpose" SET DEFAULT 'LOGIN';
COMMIT;
