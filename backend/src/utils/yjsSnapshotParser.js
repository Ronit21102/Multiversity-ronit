import * as Y from "yjs";
import { htmlConverter } from "./htmlConverter.js";

const yjsSnapshotParser = {
  // Parse changes between two Y.js snapshots
  parseChanges: (currentVersion, previousVersion) => {
    if (!previousVersion) {
      // First version - reconstruct document from snapshot
      const doc = yjsSnapshotParser.reconstructDocument(currentVersion);
      const content = yjsSnapshotParser.extractContent(doc);

      return {
        type: "initial",
        content: htmlConverter.wrapWithHeader(content, "Initial Version"),
      };
    }

    try {
      console.log("🔄 Comparing Y.js snapshots");

      // Reconstruct both document states
      const currentDoc = yjsSnapshotParser.reconstructDocument(currentVersion);
      const previousDoc =
        yjsSnapshotParser.reconstructDocument(previousVersion);

      // Get snapshots
      const currentSnapshot = Y.decodeSnapshot(
        new Uint8Array(currentVersion.yjsSnapshot)
      );
      const previousSnapshot = Y.decodeSnapshot(
        new Uint8Array(previousVersion.yjsSnapshot)
      );

      // Use Y.js to diff snapshots
      const diff = Y.diffSnapshots(
        previousSnapshot,
        currentSnapshot,
        currentDoc
      );
      console.log("📊 Y.js snapshot diff:", diff);

      // Generate visual diff
      const visualDiff = yjsSnapshotParser.generateVisualDiff(
        previousDoc,
        currentDoc,
        diff
      );

      return {
        type: "diff",
        content: visualDiff,
        previousContent: yjsSnapshotParser.extractContent(previousDoc),
        currentContent: yjsSnapshotParser.extractContent(currentDoc),
      };
    } catch (error) {
      console.error("❌ Error comparing Y.js snapshots:", error);
      return yjsSnapshotParser.generateFallback(currentVersion);
    }
  },

  // Reconstruct Y.js document from stored state
  reconstructDocument: (versionData) => {
    const doc = new Y.Doc();
    const state = new Uint8Array(versionData.yjsState);
    Y.applyUpdate(doc, state);
    return doc;
  },

  // Extract content from Y.js document
  extractContent: (doc) => {
    const fragment = doc.get("default", Y.XmlFragment);
    return fragment ? fragment.toString() : "";
  },

  // Generate visual diff using Y.js diff results
  generateVisualDiff: (previousDoc, currentDoc, diff) => {
    console.log("🎨 Generating Y.js-based visual diff");

    if (!diff || diff.length === 0) {
      const content = yjsSnapshotParser.extractContent(currentDoc);
      return htmlConverter.wrapWithHeader(
        htmlConverter.convertYjsToTiptap(content),
        "No changes detected"
      );
    }

    // Get the content from current document
    let result = yjsSnapshotParser.extractContent(currentDoc);

    // Apply Y.js diff to highlight changes
    let offset = 0;

    diff.forEach((change) => {
      if (change.action === "retain") {
        offset += change.length || 0;
      } else if (change.action === "insert") {
        // Highlight inserted content
        const insertPos = offset;
        const insertText = change.content || "";
        const highlighted = `<mark>${htmlConverter.escapeHtml(
          insertText
        )}</mark>`;

        result =
          result.slice(0, insertPos) + highlighted + result.slice(insertPos);
        offset += highlighted.length;
      } else if (change.action === "delete") {
        // Show deleted content
        const deletePos = offset;
        const deleteLength = change.length || 0;
        const deletedText = result.slice(deletePos, deletePos + deleteLength);
        const highlighted = `<del>${htmlConverter.escapeHtml(
          deletedText
        )}</del>`;

        result =
          result.slice(0, deletePos) +
          highlighted +
          result.slice(deletePos + deleteLength);
        offset += highlighted.length - deleteLength;
      }
    });

    // Convert to proper HTML
    const finalHtml = htmlConverter.convertTextToHtmlStructure(
      result,
      htmlConverter.convertYjsToTiptap(result)
    );

    return htmlConverter.wrapWithHeader(finalHtml, "Document Changes");
  },

  // Fallback for error cases
  generateFallback: (currentVersion) => {
    const doc = yjsSnapshotParser.reconstructDocument(currentVersion);
    const content = yjsSnapshotParser.extractContent(doc);

    return {
      type: "fallback",
      content: htmlConverter.wrapWithHeader(
        htmlConverter.convertYjsToTiptap(content),
        "Version Content (Fallback)"
      ),
    };
  },
};

export { yjsSnapshotParser };
