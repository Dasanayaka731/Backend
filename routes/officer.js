const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/saveOfficer", async (req, res, next) => {
  const { officerName } = req.body;
  if (!officerName) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const result = await prisma.officers.findUnique({
    where: { officerName: officerName },
  });
  if (result) {
    return res.status(400).json({ error: "Officer Already Exist" });
  }
  const officer = await prisma.officers.create({
    data: { officerName },
  });
  res.status(200).json(officer);
});

router.get("/getAllOfficers", async (req, res) => {
  try {
    const officers = await prisma.officers.findMany({});
    res.json(officers);
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;
