// Import necessary libraries and modules
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { BlobServiceClient } = require("@azure/storage-blob");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const { format } = require("date-fns-tz");

// Set the name for the Azure Blob Storage container
const containerName = "transactions";

// Create an instance of the Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
// Get a reference to the container
const containerClient = blobServiceClient.getContainerClient(containerName);

// Set up multer for handling file uploads to memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});
router.get("/getTransactionsById/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await prisma.transactions.findMany({
      where: { headTransactionsID: parseInt(id) },
      include: { receipts: true },
    });
    if (!transactions) {
      return res.json("Not Found");
    }
    // Map over transactions and fetch blob URLs from Azure Blob Storage
    const transactionsWithBlobUrls = await Promise.all(
      transactions.map(async (transaction) => {
        const receiptsWithBlobUrls = await Promise.all(
          transaction.receipts.map(async (receipt) => {
            const blobName = receipt.receiptName; // Assuming "receiptName" is the field with blob name
            const blobUrl = await getBlobUrl(blobName); // Function to get blob URL
            return { ...receipt, blobUrl };
          })
        );

        return { ...transaction, receipts: receiptsWithBlobUrls };
      })
    );

    res.json(transactionsWithBlobUrls);
  } catch (error) {
    console.log(error);
  }
});
router.get("/getHeadTransactions", async (req, res) => {
  try {
    const headTransactions = await prisma.headTransactions.findMany({});
    if (!headTransactions) {
      return res.json("Not Found");
    }
    res.json(headTransactions);
  } catch (error) {
    console.log(error);
  }
});

router.get("/getAllTransactions", async (req, res) => {
  try {
    // Fetch all transactions from the Prisma database
    const transactions = await prisma.transactions.findMany({
      include: { receipts: true },
    });

    // Map over transactions and fetch blob URLs from Azure Blob Storage
    const transactionsWithBlobUrls = await Promise.all(
      transactions.map(async (transaction) => {
        const receiptsWithBlobUrls = await Promise.all(
          transaction.receipts.map(async (receipt) => {
            const blobName = receipt.receiptName; // Assuming "receiptName" is the field with blob name
            const blobUrl = await getBlobUrl(blobName); // Function to get blob URL
            return { ...receipt, blobUrl };
          })
        );

        return { ...transaction, receipts: receiptsWithBlobUrls };
      })
    );

    res.json(transactionsWithBlobUrls);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to get blob URL
async function getBlobUrl(blobName) {
  const blobClient = containerClient.getBlobClient(blobName);
  const blobUrlWithSAS = await blobClient.generateSasUrl({
    permissions: "r", // Read permission
    expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
  });
  return blobUrlWithSAS;
}

// Define a route to handle saving a transaction with file upload
router.post("/saveTransaction", upload.array("file"), async (req, res) => {
  //console.log(req);
  try {
    // Check if the container exists, and create it if it doesn't
    const containerExists = await containerClient.exists();
    //console.log(containerExists);
    if (!containerExists) {
      const createContainerResponse = await containerClient.create();
      console.log(
        `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`
      );
    }

    const { totalCost, date, transactions, officer, referenceNo, userId } =
      req.body;
    const totalCostData = parseFloat(totalCost);
    const expendOnData = new Date(date).toISOString().split("T")[0].toString();
    const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ssXXX", {
      timeZone: "Asia/Colombo",
    });
    const headTransaction = await prisma.headTransactions.create({
      data: {
        createdAt: createdAt.toString(),
        totalCost: totalCostData,
        date: expendOnData,
        officerID: parseInt(officer),
        refferenceNo: referenceNo,
      },
      include: {
        transactions: true,
      },
    });
    let index = 0;
    const parsedTransactions = JSON.parse(transactions);
    const allTransactions = [];

    for (const transactionItem of parsedTransactions) {
      const amountData = parseFloat(transactionItem.amount);

      const transaction = await prisma.transactions.create({
        data: {
          amount: amountData,
          createdAt: createdAt.toString(),
          updatedAt: createdAt.toString(),
          headTransactionsID: headTransaction.headID,
          projectID: transactionItem.projectName,
          costTypesID: transactionItem.costType,
          user: userId,
        },
        include: {
          receipts: true,
        },
      });

      const receipts = [];
      if (transaction.fileCounts !== 0) {
        for (let i = 0; i < transactionItem.fileCounts; i++) {
          const file = req.files[index];
          const fileBuffer = file.buffer;
          const receiptName =
            "file_" +
            headTransaction.headID.toString() +
            "_" +
            transactionItem.officerName.toString() +
            "_" +
            transactionItem.projectName.toString() +
            "_" +
            transactionItem.costType.toString() +
            Date.now() +
            path.extname(file.originalname);
          const blockBlobClient =
            containerClient.getBlockBlobClient(receiptName);
          if (
            path.extname(file.originalname) === ".jpg" ||
            path.extname(file.originalname) === ".jpeg"
          ) {
            await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
              tier: "Cool",
              blobHTTPHeaders: {
                blobContentDisposition: "inline",
                blobContentType: "image/jpeg",
              },
            });
          }
          if (path.extname(file.originalname) === ".pdf") {
            await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
              tier: "Cool",
              blobHTTPHeaders: {
                blobContentDisposition: "inline",
                blobContentType: "application/pdf",
              },
            });
          }

          const receipt = await prisma.receipts.create({
            data: {
              receiptName,
              createdAt: createdAt.toString(),
              transactionID: transaction.transactionID,
            },
          });
          index++;
          receipts.push(receipt);
        }
      }

      transaction.receipts = receipts;
      allTransactions.push(transaction);
    }

    // Update the transaction response to include the receipts
    headTransaction.transactions = allTransactions;

    res.status(200).json(headTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define a route to handle updating totalCost in headTransactions and saving new transactions
router.put(
  "/updateHeadTransaction/:headTransactionId",
  upload.array("file"),
  async (req, res) => {
    console.log(req);
    const headTransactionId = parseInt(req.params.headTransactionId);
    try {
      // Check if the container exists, and create it if it doesn't
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        const createContainerResponse = await containerClient.create();
        console.log(
          `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`
        );
      }
      const { totalCost, transactions, userId } = req.body;
      const totalCostData = parseFloat(totalCost);
      const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ssXXX", {
        timeZone: "Asia/Colombo",
      });
      // Update totalCost in headTransactions
      const updatedHeadTransaction = await prisma.headTransactions.update({
        where: { headID: headTransactionId },
        data: {
          totalCost: totalCostData,
        },
        include: {
          transactions: true,
        },
      });
      let index = 0;
      const parsedTransactions = JSON.parse(transactions);
      const allTransactions = [];
      for (const transactionItem of parsedTransactions) {
        const amountData = parseFloat(transactionItem.amount);
        // Insert new transactions or update existing ones
        const transaction = await prisma.transactions.create({
          data: {
            amount: amountData,
            createdAt: createdAt.toString(),
            updatedAt: createdAt.toString(),
            headTransactionsID: updatedHeadTransaction.headID,
            projectID: transactionItem.projectName,
            costTypesID: transactionItem.costType,
            user: userId,
          },
          include: {
            receipts: true,
          },
        });
        const receipts = [];
        for (let i = 0; i < transactionItem.fileCounts; i++) {
          const file = req.files[index];
          const fileBuffer = file.buffer;
          const receiptName =
            "file_" +
            headTransactionId.toString() +
            "_" +
            transactionItem.officerName.toString() +
            "_" +
            transactionItem.projectName.toString() +
            "_" +
            transactionItem.costType.toString() +
            Date.now() +
            path.extname(file.originalname);
          const blockBlobClient =
            containerClient.getBlockBlobClient(receiptName);
          if (
            path.extname(file.originalname) === ".jpg" ||
            path.extname(file.originalname) === ".jpeg"
          ) {
            await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
              tier: "Cool",
              blobHTTPHeaders: {
                blobContentDisposition: "inline",
                blobContentType: "image/jpeg",
              },
            });
          }
          if (path.extname(file.originalname) === ".pdf") {
            await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
              tier: "Cool",
              blobHTTPHeaders: {
                blobContentDisposition: "inline",
                blobContentType: "application/pdf",
              },
            });
          }
          const receipt = await prisma.receipts.create({
            data: {
              receiptName,
              createdAt: createdAt.toString(),
              transactionID: transaction.transactionID,
            },
          });
          index++;
          receipts.push(receipt);
        }
        transaction.receipts = receipts;
        allTransactions.push(transaction);
      }
      // Update the transaction response to include the receipts
      updatedHeadTransaction.transactions = allTransactions;
      res.status(200).json(updatedHeadTransaction);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete("/deleteTransaction/:transactionId", async (req, res) => {
  console.log(req);
  const { transactionId } = req.params;
  console.log(transactionId);
  try {
    // Fetch the transaction to get the associated head ID and amount
    const transaction = await prisma.transactions.findUnique({
      where: { transactionID: parseInt(transactionId) },
    });
    const headTransaction = await prisma.headTransactions.findUnique({
      where: { headID: transaction.headTransactionsID },
    });
    console.log(transaction);
    console.log(headTransaction);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.headTransactions.update({
      where: { headID: transaction.headTransactionsID },
      data: { totalCost: headTransaction.totalCost - transaction.amount },
    });

    // Fetch associated receipts
    const associatedReceipts = await prisma.receipts.findMany({
      where: { transactionID: parseInt(transactionId) },
    });

    // Delete associated receipts
    await Promise.all(
      associatedReceipts.map(async (receipt) => {
        await prisma.receipts.delete({
          where: { receiptID: receipt.receiptID },
        });
      })
    );

    // Now, you can safely delete the transaction
    await prisma.transactions.delete({
      where: { transactionID: parseInt(transactionId) },
    });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/totalCostLastMonth", async (req, res) => {
  try {
    const today = new Date();
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59
    );
    console.log(lastMonthStart);
    console.log(lastMonthEnd);

    const transactionsLastMonth = await prisma.headTransactions.findMany({
      where: {
        date: {
          gte: lastMonthStart.toISOString(),
          lte: lastMonthEnd.toISOString(),
        },
      },
    });

    const totalCostLastMonth = transactionsLastMonth.reduce(
      (sum, transaction) => sum + transaction.totalCost,
      0
    );

    res.json({ totalCostLastMonth });
  } catch (error) {
    console.error("Error fetching total cost last month:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/totalCostCurrentMonth", async (req, res) => {
  try {
    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const transactionsCurrentMonth = await prisma.headTransactions.findMany({
      where: {
        date: {
          gte: currentMonthStart.toISOString(),
          lte: currentMonthEnd.toISOString(),
        },
      },
    });

    const totalCostCurrentMonth = transactionsCurrentMonth.reduce(
      (sum, transaction) => sum + transaction.totalCost,
      0
    );

    res.json({ totalCostCurrentMonth });
  } catch (error) {
    console.error("Error fetching total cost current month:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/totalTransactionsLastYear", async (req, res) => {
  try {
    const today = new Date();
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);

    const transactionsLastYear = await prisma.headTransactions.findMany({
      where: {
        date: {
          gte: lastYearStart.toISOString(),
          lte: lastYearEnd.toISOString(),
        },
      },
    });

    const groupedTransactions = transactionsLastYear.reduce(
      (result, transaction) => {
        const month = new Date(transaction.date).getMonth() + 1;
        result[month] = (result[month] || 0) + transaction.totalCost;
        return result;
      },
      {}
    );

    res.json(groupedTransactions);
  } catch (error) {
    console.error("Error fetching total transactions last year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/totalTransactionsCurrentYear", async (req, res) => {
  try {
    const today = new Date();
    const currentYearStart = new Date(today.getFullYear(), 0, 1);
    const currentYearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

    const transactionsCurrentYear = await prisma.headTransactions.findMany({
      where: {
        date: {
          gte: currentYearStart.toISOString(),
          lte: currentYearEnd.toISOString(),
        },
      },
    });

    // Group transactions by month
    const groupedTransactions = transactionsCurrentYear.reduce(
      (result, transaction) => {
        const month = new Date(transaction.date).getMonth() + 1; // Months are zero-based
        result[month] = (result[month] || 0) + transaction.totalCost;
        return result;
      },
      {}
    );

    res.json(groupedTransactions);
  } catch (error) {
    console.error("Error fetching total transactions current year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/totalTransactions", async (req, res) => {
  try {
    const today = new Date();
    const currentYearStart = new Date(today.getFullYear(), 0, 1);
    const currentYearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);

    const [transactionsCurrentYear, transactionsLastYear] = await Promise.all([
      prisma.headTransactions.findMany({
        where: {
          date: {
            gte: currentYearStart.toISOString(),
            lte: currentYearEnd.toISOString(),
          },
        },
      }),
      prisma.headTransactions.findMany({
        where: {
          date: {
            gte: lastYearStart.toISOString(),
            lte: lastYearEnd.toISOString(),
          },
        },
      }),
    ]);

    const groupedTransactionsCurrentYear = groupTransactionsByMonth(
      transactionsCurrentYear
    );
    const groupedTransactionsLastYear =
      groupTransactionsByMonth(transactionsLastYear);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const data = months.map((month) => ({
      month: new Date(today.getFullYear(), month - 1, 1).toLocaleString(
        "default",
        { month: "short" }
      ),
      currentYear: groupedTransactionsCurrentYear[month] || 0,
      lastYear: groupedTransactionsLastYear[month] || 0,
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching total transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function groupTransactionsByMonth(transactions) {
  return transactions.reduce((result, transaction) => {
    const month = new Date(transaction.date).getMonth() + 1;
    result[month] = (result[month] || 0) + transaction.totalCost;
    return result;
  }, {});
}

router.get("/headTransactionInfo/:headID", async (req, res) => {
  try {
    const { headID } = req.params;

    const headTransaction = await prisma.headTransactions.findUnique({
      where: { headID: parseInt(headID) },
      select: { officerID: true, date: true },
    });

    if (!headTransaction) {
      return res.status(404).json({ error: "Head Transaction not found" });
    }

    res.json({
      OfficerID: headTransaction.officerID,
      date: headTransaction.date,
    });
  } catch (error) {
    console.error("Error fetching Head Transaction info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/transactionInfo/:headID", async (req, res) => {
  try {
    const { headID } = req.params;

    const transactions = await prisma.transactions.findMany({
      where: { headTransactionsID: parseInt(headID) },
      select: { transactionID: true, createdAt: true, user: true },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching Transaction info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/costTypeTotal/:projectID", async (req, res) => {
  try {
    const { projectID } = req.params;

    const costTypeTotals = await prisma.transactions.groupBy({
      by: ["costTypesID"],
      where: { projectID: parseInt(projectID) },
      select: {
        costTypesID: true,
      },
    });

    const formattedData = await Promise.all(
      costTypeTotals.map(async (item) => {
        const totalAmount = await prisma.transactions.aggregate({
          _sum: { amount: true },
          where: {
            costTypesID: item.costTypesID,
            projectID: parseInt(projectID),
          },
        });

        const costType = await prisma.costTypes.findUnique({
          where: { costID: item.costTypesID },
        });

        return {
          costType: costType ? costType.costType : item.costTypesID,
          total: totalAmount._sum.amount || 0,
        };
      })
    );

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching costType totals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
