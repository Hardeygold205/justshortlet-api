/*
  Warnings:

  - You are about to drop the column `supabase_id` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_supabase_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "supabase_id";
