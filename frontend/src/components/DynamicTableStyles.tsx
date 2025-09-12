import { useEffect } from 'react';

interface DynamicTableStylesProps {
  maxColumns?: number;
}

const DynamicTableStyles: React.FC<DynamicTableStylesProps> = ({ maxColumns = 50 }) => {
  useEffect(() => {
    // Create or update the dynamic styles
    let styleElement = document.getElementById('dynamic-table-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'dynamic-table-styles';
      document.head.appendChild(styleElement);
    }
    
    // Generate clean CSS without overlapping headers
    const css = `
      /* Enhanced table styling for Excel-like appearance */
      .ProseMirror {
        position: relative;
        padding-left: 50px;
        padding-top: 45px;
      }

      .ProseMirror table {
        border-collapse: separate;
        border-spacing: 0;
        border: 2px solid #d1d5db;
        margin: 0;
        position: relative;
        counter-reset: row-counter;
      }

      /* Row numbers - positioned to the left of table */
      .ProseMirror tr {
        position: relative;
        counter-increment: row-counter;
      }

      .ProseMirror tr::before {
        content: counter(row-counter);
        position: absolute;
        left: -50px;
        top: 0;
        width: 45px;
        height: 100%;
        background: #f8fafc;
        border: 1px solid #d1d5db;
        border-right: 2px solid #d1d5db;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        z-index: 10;
      }

      /* Table cells styling */
      .ProseMirror td,
      .ProseMirror th {
        position: relative;
        border: 1px solid #d1d5db;
        padding: 8px 12px;
        min-width: 80px;
        background: white;
        vertical-align: top;
      }

      .ProseMirror th {
        background: #f9fafb;
        font-weight: 600;
      }

      .ProseMirror .selectedCell {
        background: #dbeafe !important;
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }

      /* Column headers - positioned above first row only */
      .ProseMirror table::before {
        content: "";
        position: absolute;
        top: -45px;
        left: -2px;
        right: -2px;
        height: 40px;
        background: #f8fafc;
        border: 2px solid #d1d5db;
        border-bottom: none;
        z-index: 5;
      }

      /* Individual column headers */
      .ProseMirror tr:first-child td::before,
      .ProseMirror tr:first-child th::before {
        position: absolute;
        top: -45px;
        left: -1px;
        right: -1px;
        height: 40px;
        background: #f8fafc;
        border-left: 1px solid #d1d5db;
        border-right: 1px solid #d1d5db;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        z-index: 15;
        pointer-events: none;
      }

      /* Corner cell for row/column intersection */
      .ProseMirror tr:first-child::after {
        content: "";
        position: absolute;
        top: -45px;
        left: -50px;
        width: 45px;
        height: 40px;
        background: #f8fafc;
        border: 2px solid #d1d5db;
        z-index: 20;
      }

      /* Cell reference display in toolbar */
      .cell-reference-display {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #374151;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        min-width: 50px;
        text-align: center;
        font-weight: 600;
      }

      /* Generate column letters ONLY for the header area (not inside cells) */
      ${Array.from({length: maxColumns}, (_, i) => {
        const letter = String.fromCharCode(65 + (i % 26));
        const columnSelector = i + 1;
        return `
.ProseMirror tr:first-child td:nth-child(${columnSelector})::before,
.ProseMirror tr:first-child th:nth-child(${columnSelector})::before { 
  content: "${letter}" !important;
  display: flex !important;
  position: absolute !important;
  top: -45px !important;
  left: -1px !important;
  right: -1px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-left: 1px solid #d1d5db !important;
  border-right: 1px solid #d1d5db !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  z-index: 15 !important;
  pointer-events: none !important;
}`;
      }).join('')}

      /* COMPLETELY HIDE all cell reference decorations and letters inside cells */
      .ProseMirror td .cell-reference,
      .ProseMirror th .cell-reference {
        display: none !important;
      }
      
      /* Remove pseudo-element content ONLY from content cells, not headers */
      .ProseMirror tr:not(:first-child) td::before,
      .ProseMirror tr:not(:first-child) th::before,
      .ProseMirror tr:not(:first-child) td::after,
      .ProseMirror tr:not(:first-child) th::after {
        display: none !important;
        content: none !important;
      }
      
      /* Also hide any decorations that might be adding letters */
      .ProseMirror td *[data-cell-ref],
      .ProseMirror th *[data-cell-ref] {
        display: none !important;
      }

      /* Hide pseudo-elements ONLY in content rows (not the first row which has headers) */
      .ProseMirror table tr:nth-child(n+2) td::before,
      .ProseMirror table tr:nth-child(n+2) th::before,
      .ProseMirror table tr:nth-child(n+2) td::after,
      .ProseMirror table tr:nth-child(n+2) th::after {
        content: none !important;
        display: none !important;
      }

      /* Allow first row to show headers but hide any extra content */
      .ProseMirror table tr:first-child td::after,
      .ProseMirror table tr:first-child th::after {
        content: none !important;
        display: none !important;
      }
    `;
    
    styleElement.textContent = css;
    
    return () => {
      // Cleanup if component unmounts
      const element = document.getElementById('dynamic-table-styles');
      if (element) {
        element.remove();
      }
    };
  }, [maxColumns]);

  return null; // This component doesn't render anything visible
};

export default DynamicTableStyles;
