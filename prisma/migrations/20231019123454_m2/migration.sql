/*
  Warnings:

  - The required column `userID` was added to the `Users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "userID" TEXT NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("userID");
