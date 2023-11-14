/*
  Warnings:

  - You are about to drop the column `officerID` on the `Transactions` table. All the data in the column will be lost.
  - Added the required column `officer` to the `HeadTransactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user` to the `HeadTransactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_officerID_fkey";

-- AlterTable
ALTER TABLE "HeadTransactions" ADD COLUMN     "officer" TEXT NOT NULL,
ADD COLUMN     "user" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transactions" DROP COLUMN "officerID";
