// Helper function to convert column index to Excel-like letter (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.)
export function columnIndexToLetter(index: number): string {
  let result = "";
  let columnIndex = index;
  
  while (columnIndex >= 0) {
    result = String.fromCharCode(65 + (columnIndex % 26)) + result;
    columnIndex = Math.floor(columnIndex / 26) - 1;
  }
  
  return result;
}

// Helper function to convert Excel-like letter to column index (A -> 0, B -> 1, ..., Z -> 25, AA -> 26, etc.)
export function letterToColumnIndex(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
}

// Generate CSS for column headers dynamically
export function generateColumnHeaderCSS(maxColumns = 50): string {
  let css = '';
  
  for (let i = 0; i < maxColumns; i++) {
    const columnLetter = columnIndexToLetter(i);
    const columnSelector = i + 1; // CSS nth-child is 1-based
    
    css += `
.ProseMirror tr:first-child td:nth-child(${columnSelector})::before,
.ProseMirror tr:first-child th:nth-child(${columnSelector})::before { 
  content: "${columnLetter}"; 
}`;
  }
  
  return css;
}

// Function to get current cell reference from editor state
export function getCurrentCellReference(state: any): string | null {
  const { selection } = state;
  const { $from } = selection;

  // Check if we're inside a table cell
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      // Find the table and calculate position
      const table = $from.node(d - 1); // Parent should be tableRow, grandparent should be table
      if (table && table.type.name === "table") {
        // Get row and column indices
        let rowIndex = 0;
        let colIndex = 0;

        // Find which row we're in
        const tableRow = $from.node(d - 1);
        if (tableRow && tableRow.type.name === "tableRow") {
          // Count rows before this one
          const tableNode = $from.node(d - 2);
          if (tableNode && tableNode.type.name === "table") {
            for (let i = 0; i < tableNode.childCount; i++) {
              const row = tableNode.child(i);
              if (row === tableRow) {
                rowIndex = i;
                break;
              }
            }

            // Count columns before this one
            for (let i = 0; i < tableRow.childCount; i++) {
              const cell = tableRow.child(i);
              if (cell === node) {
                colIndex = i;
                break;
              }
            }
          }
        }

        return `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;
      }
    }
  }

  return null;
}
