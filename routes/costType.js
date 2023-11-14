const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/saveCostType", async (req, res, next) => {
  const { costType } = req.body;
  if (!costType) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const result = await prisma.costTypes.findUnique({
    where: { costType: costType },
  });
  if (result) {
    return res.status(400).json({ error: "Cost Type Already Exist" });
  }
  const cost = await prisma.costTypes.create({
    data: { costType },
  });
  res.status(200).json(cost);
});
router.get("/getAllCostTypes", async (req, res) => {
  try {
    const costTypes = await prisma.costTypes.findMany({});
    res.json(costTypes);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
