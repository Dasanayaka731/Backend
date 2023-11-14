const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.post("/saveClient", async (req, res, next) => {
  console.log(req);
  const {
    clientName,
    province: { label: provinceLabel },
    district: { label: districtLabel },
  } = req.body;
  //const { clientName, district, province } = req.body;
  // console.log(clientName);
  // console.log(districtLabel);
  // console.log(provinceLabel);

  try {
    if (!clientName || !districtLabel || !provinceLabel) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await prisma.clients.findUnique({
      where: { clientName: clientName },
    });

    if (result) {
      return res.status(400).json({ error: "Client Already Exists" });
    }

    const client = await prisma.clients.create({
      data: { clientName, district: districtLabel, province: provinceLabel },
    });

    res.status(200).json(client);
  } catch (err) {
    next(err);
  }
});

router.get("/getAllClients", async (req, res, next) => {
  try {
    const clients = await prisma.clients.findMany({});
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
