import { Extension } from "@tiptap/core";

export const CellReferenceExtension = Extension.create({
  name: "cellReference",

  // This extension just provides the cell reference functionality
  // The visual references are handled by CSS
  addGlobalAttributes() {
    return [
      {
        types: ["tableCell", "tableHeader"],
        attributes: {
          cellRef: {
            default: null,
            rendered: false,
          },
        },
      },
    ];
  },
});
