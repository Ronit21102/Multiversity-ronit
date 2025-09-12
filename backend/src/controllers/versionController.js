import fs from "fs";
import * as Y from "yjs";
import { documentVersions } from "../utils/storage.js";
import { yjsParser } from "../utils/yjsParser.js";

// Helper function to convert column index to Excel-like letter
function columnIndexToLetter(index) {
  let result = "";
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

// Extract cell contents from Y.js document using Tiptap structure
function extractCellContents(yjsState) {
  if (!yjsState) return {};
  
  try {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, new Uint8Array(yjsState));
    
    const cellContents = {};
    
    // Get the document content as XML fragment
    const fragment = doc.getXmlFragment("default");
    
    console.log("Debug: Y.js document structure:");
    console.log("Fragment length:", fragment.length);
    console.log("Fragment toString:", fragment.toString());
    
    // Get JSON representation of the document
    const docJSON = fragment.toJSON();
    console.log("Debug: Document JSON:", JSON.stringify(docJSON, null, 2));
    
    // Parse Tiptap document structure
    if (typeof docJSON === "string") {
      // Parse the XML-like string to find table cells
      const cellContents = parseTiptapTableStructure(docJSON);
      return cellContents;
    }
    
    // If it's not a string, try to parse as object/array structure
    if (Array.isArray(docJSON) || (docJSON && typeof docJSON === "object")) {
      return parseTiptapJSONStructure(docJSON);
    }
    
    return {};
    
  } catch (error) {
    console.error("Error extracting cell contents:", error);
    return {};
  }
}

// Parse Tiptap XML string structure to extract table cells
function parseTiptapTableStructure(xmlString) {
  const cellContents = {};
  
  try {
    console.log("Debug: Parsing Tiptap XML structure:", xmlString);
    
    // Look for table structures with Tiptap node names
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    const tableMatches = xmlString.match(tableRegex);
    
    if (tableMatches) {
      tableMatches.forEach((tableHtml, tableIndex) => {
        console.log(`Debug: Found table ${tableIndex}:`, tableHtml);
        
        // Extract table rows (tableRow nodes)
        const rowRegex = /<tablerow[^>]*>([\s\S]*?)<\/tablerow>/gi;
        const rowMatches = tableHtml.match(rowRegex);
        
        if (rowMatches) {
          rowMatches.forEach((rowHtml, rowIndex) => {
            console.log(`Debug: Row ${rowIndex}:`, rowHtml);
            
            // Extract table cells (tablecell and tableheader nodes)
            const cellRegex = /<(tablecell|tableheader)[^>]*>([\s\S]*?)<\/\1>/gi;
            let cellMatch;
            let colIndex = 0;
            
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
              const cellContent = cellMatch[2];
              const cellRef = `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;
              
              // Extract text content from cell (remove nested tags)
              const cellText = cellContent.replace(/<[^>]*>/g, '').trim();
              
              console.log(`Debug: Cell ${cellRef}:`, cellText);
              
              if (cellText.length > 0) {
                cellContents[cellRef] = cellText;
              }
              
              colIndex++;
            }
          });
        }
      });
    }
    
  } catch (error) {
    console.error("Error parsing Tiptap table structure:", error);
  }
  
  return cellContents;
}

// Parse Tiptap JSON structure to extract table cells
function parseTiptapJSONStructure(jsonData) {
  const cellContents = {};
  
  try {
    console.log("Debug: Parsing Tiptap JSON structure:", JSON.stringify(jsonData, null, 2));
    
    const parseNode = (node, context = { rowIndex: 0, colIndex: 0 }) => {
      if (!node || typeof node !== "object") return;
      
      if (Array.isArray(node)) {
        node.forEach(item => parseNode(item, context));
        return;
      }
      
      // Check if this is a table node
      if (node.type === "table" && node.content) {
        let rowIndex = 0;
        node.content.forEach(rowNode => {
          if (rowNode.type === "tableRow" && rowNode.content) {
            let colIndex = 0;
            rowNode.content.forEach(cellNode => {
              if ((cellNode.type === "tableCell" || cellNode.type === "tableHeader") && cellNode.content) {
                const cellRef = `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;
                
                // Extract text from cell content
                const cellText = extractTextFromNode(cellNode);
                
                console.log(`Debug: Cell ${cellRef}:`, cellText);
                
                if (cellText.trim().length > 0) {
                  cellContents[cellRef] = cellText.trim();
                }
                
                colIndex++;
              }
            });
          }
          rowIndex++;
        });
      }
      
      // Recursively search for table nodes in content
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(child => parseNode(child, context));
      }
      
      // Handle other possible structures
      if (node.attrs || node.marks || node.text) {
        // This might be content within a cell
        if (node.text) {
          console.log("Debug: Found text node:", node.text);
        }
      }
    };
    
    parseNode(jsonData);
    
  } catch (error) {
    console.error("Error parsing Tiptap JSON structure:", error);
  }
  
  return cellContents;
}

// Extract text content from a Tiptap node
function extractTextFromNode(node) {
  if (!node) return "";
  
  if (typeof node === "string") return node;
  
  if (node.text) return node.text;
  
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join("");
  }
  
  return "";
}

// Compare cell contents between versions and generate detailed changes
function extractCellChanges(currentVersion, previousVersion) {
  const currentCells = extractCellContents(currentVersion?.yjsState);
  const previousCells = extractCellContents(previousVersion?.yjsState);
  
  const changes = [];
  
  // Get all unique cell references from both versions
  const allCells = new Set([
    ...Object.keys(currentCells),
    ...Object.keys(previousCells)
  ]);
  
  allCells.forEach(cellRef => {
    const currentContent = currentCells[cellRef] || "";
    const previousContent = previousCells[cellRef] || "";
    
    if (currentContent !== previousContent) {
      changes.push({
        cellRef,
        previousContent,
        currentContent,
        changeType: 
          !previousContent && currentContent ? "added" :
          previousContent && !currentContent ? "deleted" :
          "modified"
      });
    }
  });
  
  return changes;
}

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
        cellInfo: version.cellInfo || {}, // Include cell information in API response
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

      // Extract detailed cell changes
      const cellChanges = extractCellChanges(versionData, previousVersionData);

      // Return Y.js snapshots for frontend to process
      res.json({
        versionId: parseInt(versionId),
        currentSnapshot: versionData.yjsSnapshot,
        previousSnapshot: previousVersionData?.yjsSnapshot || null,
        currentState: versionData.yjsState,
        previousState: previousVersionData?.yjsState || null,
        timestamp: versionData.timestamp,
        savedBy: versionData.savedBy,
        cellInfo: versionData.cellInfo || {}, // Include cell information in diff response
        previousCellInfo: previousVersionData?.cellInfo || {}, // Include previous version cell info
        cellChanges: cellChanges, // Detailed cell-by-cell changes
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
