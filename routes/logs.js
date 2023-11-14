const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.post("/saveLogs", async (req, res) => {
  try {
    const { user, action, id } = req.body;
    const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ssXXX", {
      timeZone: "Asia/Colombo",
    });
    const applog = await prisma.loges.create({
      data: {
        user,
        action,
        createdAt: createdAt.toString(),
        referenceID: id,
      },
    });
    res.status(200).json(applog);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
