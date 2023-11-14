-- CreateTable
CREATE TABLE "Clients" (
    "clientID" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("clientID")
);

-- CreateTable
CREATE TABLE "Projects" (
    "projectID" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "maxBudget" DOUBLE PRECISION NOT NULL,
    "minBudget" DOUBLE PRECISION NOT NULL,
    "clientID" TEXT NOT NULL,

    CONSTRAINT "Projects_pkey" PRIMARY KEY ("projectID")
);

-- CreateTable
CREATE TABLE "CostTypes" (
    "costID" TEXT NOT NULL,
    "costType" TEXT NOT NULL,

    CONSTRAINT "CostTypes_pkey" PRIMARY KEY ("costID")
);

-- CreateTable
CREATE TABLE "Officers" (
    "officerID" TEXT NOT NULL,
    "officerName" TEXT NOT NULL,

    CONSTRAINT "Officers_pkey" PRIMARY KEY ("officerID")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "transactionID" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expendOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerID" TEXT NOT NULL,
    "projectID" TEXT NOT NULL,
    "costTypesID" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("transactionID")
);

-- CreateTable
CREATE TABLE "Receipts" (
    "receiptID" TEXT NOT NULL,
    "receiptName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionID" TEXT NOT NULL,

    CONSTRAINT "Receipts_pkey" PRIMARY KEY ("receiptID")
);

-- CreateTable
CREATE TABLE "Users" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Clients_clientName_key" ON "Clients"("clientName");

-- CreateIndex
CREATE UNIQUE INDEX "Projects_projectName_key" ON "Projects"("projectName");

-- CreateIndex
CREATE UNIQUE INDEX "CostTypes_costType_key" ON "CostTypes"("costType");

-- CreateIndex
CREATE UNIQUE INDEX "Officers_officerName_key" ON "Officers"("officerName");

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_projectID_costTypesID_key" ON "Transactions"("projectID", "costTypesID");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_clientID_fkey" FOREIGN KEY ("clientID") REFERENCES "Clients"("clientID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_officerID_fkey" FOREIGN KEY ("officerID") REFERENCES "Officers"("officerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_projectID_fkey" FOREIGN KEY ("projectID") REFERENCES "Projects"("projectID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_costTypesID_fkey" FOREIGN KEY ("costTypesID") REFERENCES "CostTypes"("costID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipts" ADD CONSTRAINT "Receipts_transactionID_fkey" FOREIGN KEY ("transactionID") REFERENCES "Transactions"("transactionID") ON DELETE RESTRICT ON UPDATE CASCADE;
