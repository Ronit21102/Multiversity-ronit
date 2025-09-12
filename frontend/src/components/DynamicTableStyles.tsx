import { useEffect } from 'react';
import { generateColumnHeaderCSS } from '@/utils/cellReference';

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
    
    // Generate the CSS for column headers
    const css = `
      /* Enhanced table styling for Excel-like appearance */
      .ProseMirror table {
        border-collapse: separate;
        border-spacing: 0;
        border: 2px solid #d1d5db;
        margin: 20px 0;
        position: relative;
        counter-reset: row-counter;
      }

      /* Row numbers */
      .ProseMirror tr {
        position: relative;
      }

      .ProseMirror tr::before {
        content: counter(row-counter);
        counter-increment: row-counter;
        position: absolute;
        left: -30px;
        top: 0;
        width: 25px;
        height: 100%;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-right: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        z-index: 10;
        min-height: 40px;
      }

      /* Column headers - positioned above cells */
      .ProseMirror td::after,
      .ProseMirror th::after {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        background: #f8fafc;
        padding: 2px 6px;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        z-index: 10;
        min-width: 20px;
        text-align: center;
      }

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

      ${generateColumnHeaderCSS(maxColumns)}
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
