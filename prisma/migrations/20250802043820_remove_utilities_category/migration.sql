/*
  Warnings:

  - You are about to drop the `TotalSavings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "subcategory" TEXT;

-- DropTable
DROP TABLE "public"."TotalSavings";
