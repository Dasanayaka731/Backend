const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.get("/getAllProjects", async (req, res, next) => {
  try {
    const projects = await prisma.projects.findMany({});
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post("/saveProject", async (req, res, next) => {
  const { projectName, maxBudget, minBudget, client } = req.body;
  //console.log(req);
  console.log(req.body);
  try {
    if (!projectName || !maxBudget || !minBudget || !client) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const result = await prisma.projects.findUnique({
      where: { projectName: projectName },
    });
    if (result) {
      return res.status(400).json({ error: "Project Already Exist" });
    }
    const project = await prisma.projects.create({
      data: { projectName, maxBudget, minBudget, clientID: client },
    });
    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
});

router.get("/getProjectDetails/:projectID", async (req, res) => {
  console.log(req);
  try {
    const { projectID } = req.params;

    // Validate projectID
    if (!projectID) {
      return res.status(400).json({ error: "Project ID is required." });
    }

    // Fetch project details based on projectID
    const projectDetails = await prisma.projects.findUnique({
      where: { projectID: projectID },
    });

    // Check if the project exists
    if (!projectDetails) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.status(200).json(projectDetails);
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
