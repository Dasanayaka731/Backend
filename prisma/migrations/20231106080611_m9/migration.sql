-- DropForeignKey
ALTER TABLE "Receipts" DROP CONSTRAINT "Receipts_transactionID_fkey";

-- AddForeignKey
ALTER TABLE "Receipts" ADD CONSTRAINT "Receipts_transactionID_fkey" FOREIGN KEY ("transactionID") REFERENCES "Transactions"("transactionID") ON DELETE CASCADE ON UPDATE CASCADE;
