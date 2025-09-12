import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Y from "yjs";
import { lastSavedStates, documentVersions } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const documentSaver = {
  // Handle document save events
  handleSaveEvent: async (data) => {
    console.log(`📨 Custom event received for ${data.documentName}`);

    try {
      const payload = JSON.parse(data.payload);

      if (payload.type === "SAVE_DOCUMENT_CUSTOM") {
        console.log(`💾 Custom save triggered for ${data.documentName}`);
        return await documentSaver.saveDocument(data, payload);
      }
    } catch (error) {
      console.error("❌ Error handling custom event:", error);
    }
  },

  // Save document with Y.js snapshots instead of states
  saveDocument: async (data, payload) => {
    const doc = data.document;

    if (!doc) {
      console.log("❌ Document not found");
      return;
    }

    // Create logs directory
    const logsDir = path.join(__dirname, "..", "..", "..", "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create Y.js snapshot (this is what we should be storing!)
    const snapshot = Y.snapshot(doc);
    const snapshotData = Y.encodeSnapshot(snapshot);

    // Also keep state for reconstruction
    const currentState = Y.encodeStateAsUpdate(doc);

    // Create save data with Y.js snapshot and cell information
    const saveData = {
      timestamp: new Date().toISOString(),
      documentName: data.documentName,
      savedBy: payload.user || "Unknown",
      // Store Y.js snapshot for proper versioning
      yjsSnapshot: Array.from(snapshotData),
      yjsState: Array.from(currentState), // Keep for reconstruction
      // Cell-level tracking information
      cellInfo: {
        currentCellRef: payload.currentCellRef || null,
        editedCells: payload.editedCells || [],
        cellChangeContext: payload.cellChangeContext || {},
      },
    };

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${data.documentName}-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(saveData, null, 2));
    console.log(`✅ Document snapshot saved to: ${filepath}`);

    // Store version info
    if (!documentVersions.has(data.documentName)) {
      documentVersions.set(data.documentName, []);
    }
    documentVersions.get(data.documentName).push({
      timestamp: saveData.timestamp,
      savedBy: payload.user || "Unknown",
      filePath: filepath,
      cellInfo: saveData.cellInfo, // Include cell information in version metadata
    });

    console.log(
      `📋 Snapshot version added. Total versions for ${data.documentName}: ${
        documentVersions.get(data.documentName).length
      }`
    );

    // Update last saved state
    lastSavedStates.set(data.documentName, currentState);
  },
};

export { documentSaver };
