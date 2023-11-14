/*
  Warnings:

  - You are about to drop the column `officer` on the `HeadTransactions` table. All the data in the column will be lost.
  - Added the required column `officerID` to the `HeadTransactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refferenceNo` to the `HeadTransactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HeadTransactions" DROP COLUMN "officer",
ADD COLUMN     "officerID" INTEGER NOT NULL,
ADD COLUMN     "refferenceNo" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "HeadTransactions" ADD CONSTRAINT "HeadTransactions_officerID_fkey" FOREIGN KEY ("officerID") REFERENCES "Officers"("officerID") ON DELETE RESTRICT ON UPDATE CASCADE;
