/*
  Warnings:

  - You are about to drop the column `user` on the `HeadTransactions` table. All the data in the column will be lost.
  - Added the required column `user` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HeadTransactions" DROP COLUMN "user";

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "user" TEXT NOT NULL;
