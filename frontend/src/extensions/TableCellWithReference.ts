import { TableCell } from '@tiptap/extension-table-cell';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Helper function to convert column index to Excel-like letter (0 -> A, 1 -> B, etc.)
export function columnIndexToLetter(index: number): string {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
}

// Helper function to get cell coordinates (row, col) from table
export function getCellCoordinates(table: ProseMirrorNode, cellPos: number): { row: number; col: number } {
  let currentPos = 1; // Start after table tag
  let rowIndex = 0;
  
  for (let i = 0; i < table.childCount; i++) {
    const row = table.child(i);
    let colIndex = 0;
    
    for (let j = 0; j < row.childCount; j++) {
      const cell = row.child(j);
      const cellStart = currentPos;
      const cellEnd = currentPos + cell.nodeSize;
      
      if (cellPos >= cellStart && cellPos < cellEnd) {
        return { row: rowIndex, col: colIndex };
      }
      
      currentPos = cellEnd;
      colIndex++;
    }
    rowIndex++;
  }
  
  return { row: 0, col: 0 };
}

// Plugin to add cell reference decorations
const cellReferencePlugin = new Plugin({
  key: new PluginKey('cellReference'),
  
  state: {
    init() {
      return DecorationSet.empty;
    },
    
    apply(tr, decorationSet) {
      // Remove old decorations and add new ones
      decorationSet = decorationSet.map(tr.mapping, tr.doc);
      
      const decorations: Decoration[] = [];
      
      // Find all tables in the document
      tr.doc.descendants((node, pos) => {
        if (node.type.name === 'table') {
          // Add column headers and row numbers for this table
          let currentPos = pos + 1;
          
          for (let rowIndex = 0; rowIndex < node.childCount; rowIndex++) {
            const row = node.child(rowIndex);
            
            for (let colIndex = 0; colIndex < row.childCount; colIndex++) {
              const cell = row.child(colIndex);
              const cellPos = currentPos;
              
              // Create cell reference (A1, B2, etc.)
              const cellRef = `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;
              
              // Add decoration for cell reference
              decorations.push(
                Decoration.widget(cellPos + 1, () => {
                  const span = document.createElement('span');
                  span.className = 'cell-reference';
                  span.textContent = cellRef;
                  span.style.cssText = `
                    position: absolute;
                    top: -18px;
                    left: 2px;
                    font-size: 10px;
                    color: #666;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 1px 3px;
                    border-radius: 2px;
                    font-family: monospace;
                    pointer-events: none;
                    z-index: 10;
                  `;
                  return span;
                }, {
                  side: 1,
                  key: `cell-ref-${cellPos}`
                })
              );
              
              currentPos += cell.nodeSize;
            }
          }
        }
        return node.type.name !== 'table';
      });
      
      return DecorationSet.create(tr.doc, decorations);
    }
  },
  
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Extended TableCell with cell reference functionality
export const TableCellWithReference = TableCell.extend({
  name: 'tableCellWithReference',
  
  addProseMirrorPlugins() {
    return [
      cellReferencePlugin
    ];
  },
  
  addCommands() {
    return {
      // Command to get current cell reference
      getCurrentCellReference: () => ({ state }: { state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Find the table containing the selection
        let tableNode = null;
        let tablePos = 0;
        
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'table') {
            tableNode = node;
            tablePos = $from.before(d);
            break;
          }
        }
        
        if (tableNode) {
          const coords = getCellCoordinates(tableNode, $from.pos - tablePos);
          const cellRef = `${columnIndexToLetter(coords.col)}${coords.row + 1}`;
          return cellRef;
        }
        
        return null;
      },
    };
  },
});
