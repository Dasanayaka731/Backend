const router = require("express").Router();
const { BlobServiceClient } = require("@azure/storage-blob");

const containerName = "transactions";
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerClient = blobServiceClient.getContainerClient(containerName);

// Define a route to list all blobs in the container
router.get("/listBlobs", async (req, res) => {
  try {
    // List blobs in the container
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }

    res.json(blobs);
  } catch (error) {
    console.error("Error listing blobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/deleteContainer", async (req, res) => {
  try {
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      return res.status(404).json({ error: "Container not found." });
    }
    // Delete the container
    const deleteContainerResponse = await containerClient.delete();

    // Check if the container was deleted successfully
    if (deleteContainerResponse._response.status === 202) {
      //console.log("Container deleted successfully.");
      res.status(200).json({ message: "Container deleted successfully." });
    } else {
      //console.error("Failed to delete container:", deleteContainerResponse);
      res.status(500).json({ error: "Failed to delete container." });
    }
  } catch (error) {
    //console.error("Error deleting container:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
