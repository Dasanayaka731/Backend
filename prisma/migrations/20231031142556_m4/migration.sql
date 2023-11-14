/*
  Warnings:

  - The primary key for the `Clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `clientID` column on the `Clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CostTypes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `costID` column on the `CostTypes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Officers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `officerID` column on the `Officers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `projectID` column on the `Projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Receipts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `receiptID` column on the `Receipts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `expendOn` on the `Transactions` table. All the data in the column will be lost.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `userID` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `date` to the `HeadTransactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `clientID` on the `Projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `officerID` on the `Transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectID` on the `Transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `costTypesID` on the `Transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Projects" DROP CONSTRAINT "Projects_clientID_fkey";

-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_costTypesID_fkey";

-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_officerID_fkey";

-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_projectID_fkey";

-- AlterTable
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_pkey",
DROP COLUMN "clientID",
ADD COLUMN     "clientID" SERIAL NOT NULL,
ADD CONSTRAINT "Clients_pkey" PRIMARY KEY ("clientID");

-- AlterTable
ALTER TABLE "CostTypes" DROP CONSTRAINT "CostTypes_pkey",
DROP COLUMN "costID",
ADD COLUMN     "costID" SERIAL NOT NULL,
ADD CONSTRAINT "CostTypes_pkey" PRIMARY KEY ("costID");

-- AlterTable
ALTER TABLE "HeadTransactions" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Officers" DROP CONSTRAINT "Officers_pkey",
DROP COLUMN "officerID",
ADD COLUMN     "officerID" SERIAL NOT NULL,
ADD CONSTRAINT "Officers_pkey" PRIMARY KEY ("officerID");

-- AlterTable
ALTER TABLE "Projects" DROP CONSTRAINT "Projects_pkey",
DROP COLUMN "projectID",
ADD COLUMN     "projectID" SERIAL NOT NULL,
DROP COLUMN "clientID",
ADD COLUMN     "clientID" INTEGER NOT NULL,
ADD CONSTRAINT "Projects_pkey" PRIMARY KEY ("projectID");

-- AlterTable
ALTER TABLE "Receipts" DROP CONSTRAINT "Receipts_pkey",
DROP COLUMN "receiptID",
ADD COLUMN     "receiptID" SERIAL NOT NULL,
ADD CONSTRAINT "Receipts_pkey" PRIMARY KEY ("receiptID");

-- AlterTable
ALTER TABLE "Transactions" DROP COLUMN "expendOn",
DROP COLUMN "officerID",
ADD COLUMN     "officerID" INTEGER NOT NULL,
DROP COLUMN "projectID",
ADD COLUMN     "projectID" INTEGER NOT NULL,
DROP COLUMN "costTypesID",
ADD COLUMN     "costTypesID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
DROP COLUMN "userID",
ADD COLUMN     "userID" SERIAL NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("userID");

-- CreateTable
CREATE TABLE "Loges" (
    "logID" SERIAL NOT NULL,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "referenceID" INTEGER NOT NULL,

    CONSTRAINT "Loges_pkey" PRIMARY KEY ("logID")
);

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_clientID_fkey" FOREIGN KEY ("clientID") REFERENCES "Clients"("clientID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_officerID_fkey" FOREIGN KEY ("officerID") REFERENCES "Officers"("officerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_projectID_fkey" FOREIGN KEY ("projectID") REFERENCES "Projects"("projectID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_costTypesID_fkey" FOREIGN KEY ("costTypesID") REFERENCES "CostTypes"("costID") ON DELETE RESTRICT ON UPDATE CASCADE;
