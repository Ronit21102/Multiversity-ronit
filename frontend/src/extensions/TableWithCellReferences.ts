import { Table } from "@tiptap/extension-table";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// Helper function to convert column index to Excel-like letter
function columnIndexToLetter(index: number): string {
  let result = "";
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

// Plugin to add data attributes for cell references
const cellReferenceDataPlugin = new Plugin({
  key: new PluginKey("cellReferenceData"),

  appendTransaction(transactions, oldState, newState) {
    let modified = false;
    const tr = newState.tr;

    newState.doc.descendants((node, pos) => {
      if (node.type.name === "table") {
        let currentPos = pos + 1;

        for (let rowIndex = 0; rowIndex < node.childCount; rowIndex++) {
          const row = node.child(rowIndex);

          for (let colIndex = 0; colIndex < row.childCount; colIndex++) {
            const cell = row.child(colIndex);
            const cellRef = `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;

            // Check if cell needs the reference attribute
            const currentAttrs = cell.attrs || {};
            if (currentAttrs.cellRef !== cellRef) {
              tr.setNodeMarkup(currentPos, null, {
                ...currentAttrs,
                cellRef: cellRef,
              });
              modified = true;
            }

            currentPos += cell.nodeSize;
          }
        }
      }
    });

    return modified ? tr : null;
  },
});

export const TableWithCellReferences = Table.extend({
  name: "tableWithReferences",

  addProseMirrorPlugins() {
    return [...(this.parent?.() || []), cellReferenceDataPlugin];
  },
});
