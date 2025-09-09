import fs from "fs";
import { documentVersions } from "../utils/storage.js";
import { yjsParser } from "../utils/yjsParser.js";

const versionController = {
  // Get version history for a document
  getVersionHistory: (req, res) => {
    const { documentName } = req.params;
    console.log(`📋 API request for versions of: ${documentName}`);

    const versions = documentVersions.get(documentName) || [];
    console.log(`📋 Found ${versions.length} versions`);

    res.json({
      documentName,
      versions: versions.map((version, index) => ({
        id: index + 1,
        name: `Version ${index + 1}`,
        timestamp: version.timestamp,
        savedBy: version.savedBy,
        filePath: version.filePath,
      })),
    });
  },

  // Return Y.js snapshots for frontend diff processing
  getVersionDiff: (req, res) => {
    const { documentName, versionId } = req.params;
    console.log(
      `📋 API request for snapshot diff of version ${versionId} of: ${documentName}`
    );

    const versions = documentVersions.get(documentName) || [];
    const versionIndex = parseInt(versionId) - 1;
    console.log("vesrsions", versions, versionIndex);

    if (versionIndex < 0 || versionIndex >= versions.length) {
      return res.status(404).json({ error: "Version not found" });
    }

    try {
      const versionData = JSON.parse(
        fs.readFileSync(versions[versionIndex].filePath, "utf8")
      );

      let previousVersionData = null;
      if (versionIndex > 0) {
        previousVersionData = JSON.parse(
          fs.readFileSync(versions[versionIndex - 1].filePath, "utf8")
        );
      }

      // Return Y.js snapshots for frontend to process
      res.json({
        versionId: parseInt(versionId),
        currentSnapshot: versionData.yjsSnapshot,
        previousSnapshot: previousVersionData?.yjsSnapshot || null,
        currentState: versionData.yjsState,
        previousState: previousVersionData?.yjsState || null,
        timestamp: versionData.timestamp,
        savedBy: versionData.savedBy,
      });
    } catch (error) {
      console.error("Error getting version snapshots:", error);
      res.status(500).json({ error: "Failed to get version snapshots" });
    }
  },

  // Return Y.js state for content reconstruction
  getVersionContent: (req, res) => {
    const { documentName, versionId } = req.params;
    console.log(
      `📋 API request for content of version ${versionId} of: ${documentName}`
    );

    const versions = documentVersions.get(documentName) || [];
    const versionIndex = parseInt(versionId) - 1;

    if (versionIndex < 0 || versionIndex >= versions.length) {
      return res.status(404).json({ error: "Version not found" });
    }

    try {
      const versionData = JSON.parse(
        fs.readFileSync(versions[versionIndex].filePath, "utf8")
      );

      res.json({
        yjsState: versionData.yjsState,
        yjsSnapshot: versionData.yjsSnapshot,
        timestamp: versionData.timestamp,
        savedBy: versionData.savedBy,
      });
    } catch (error) {
      console.error("Error getting version content:", error);
      res.status(500).json({ error: "Failed to get version content" });
    }
  },
};

export { versionController };
