/*
  Warnings:

  - The primary key for the `Transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `transactionID` column on the `Transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `transactionID` on the `Receipts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `headTransactionsID` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Receipts" DROP CONSTRAINT "Receipts_transactionID_fkey";

-- DropIndex
DROP INDEX "Transactions_projectID_costTypesID_key";

-- AlterTable
ALTER TABLE "Receipts" DROP COLUMN "transactionID",
ADD COLUMN     "transactionID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_pkey",
ADD COLUMN     "headTransactionsID" INTEGER NOT NULL,
DROP COLUMN "transactionID",
ADD COLUMN     "transactionID" SERIAL NOT NULL,
ADD CONSTRAINT "Transactions_pkey" PRIMARY KEY ("transactionID");

-- CreateTable
CREATE TABLE "HeadTransactions" (
    "headID" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HeadTransactions_pkey" PRIMARY KEY ("headID")
);

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_headTransactionsID_fkey" FOREIGN KEY ("headTransactionsID") REFERENCES "HeadTransactions"("headID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipts" ADD CONSTRAINT "Receipts_transactionID_fkey" FOREIGN KEY ("transactionID") REFERENCES "Transactions"("transactionID") ON DELETE RESTRICT ON UPDATE CASCADE;
