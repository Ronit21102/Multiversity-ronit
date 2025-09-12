import React, { useEffect, useState } from "react";

import { Editor } from "@tiptap/react";

import { getCurrentCellReference } from "@/utils/cellReference";

interface CellReferenceDisplayProps {
  editor: Editor;
}

const CellReferenceDisplay: React.FC<CellReferenceDisplayProps> = ({
  editor,
}) => {
  const [currentCellRef, setCurrentCellRef] = useState<string | null>(null);

  useEffect(() => {
    const updateCellRef = () => {
      if (editor) {
        const cellRef = getCurrentCellReference(editor.state);
        setCurrentCellRef(cellRef);
      }
    };

    // Update on selection change
    editor.on("selectionUpdate", updateCellRef);
    editor.on("transaction", updateCellRef);

    // Initial update
    updateCellRef();

    return () => {
      editor.off("selectionUpdate", updateCellRef);
      editor.off("transaction", updateCellRef);
    };
  }, [editor]);

  if (!currentCellRef) {
    return null;
  }

  return <div className="cell-reference-display">{currentCellRef}</div>;
};

export default CellReferenceDisplay;
