import React from "react";

import { Editor, EditorContent } from "@tiptap/react";

import { VersionDiff } from "../types/editor";

interface VersionPreviewProps {
  showVersionPreview: boolean;
  selectedVersionDiff: VersionDiff | null;
  previewEditor: Editor | null;
  diffData: Array<{
    type: "added" | "removed" | "unchanged";
    content: string;
    lineNumber?: number;
  }> | null;
  onApplyVersion: () => void;
  onDiscardVersion: () => void;
  onCellClick?: (cellRef: string) => void;
}

const VersionPreview: React.FC<VersionPreviewProps> = ({
  showVersionPreview,
  selectedVersionDiff,
  previewEditor,
  diffData,
  onApplyVersion,
  onDiscardVersion,
  onCellClick,
}) => {
  if (!showVersionPreview || !selectedVersionDiff) {
    return null;
  }

  return (
    <div className="w-1/2 rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
      {/* Preview Header */}
      <div className="border-b border-orange-200 bg-orange-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-900">
            📄 Version {selectedVersionDiff.versionId}{" "}
            {diffData ? "Diff" : "Preview"}
          </h3>
          <button
            onClick={onDiscardVersion}
            className="rounded-md p-1 text-orange-600 hover:bg-orange-200 hover:text-orange-800"
            title="Close preview"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-orange-700">
          {diffData ?
            "Changes from previous version (+ added, - removed)"
          : "Read-only preview of version content"}
        </p>
        {/* Detailed Cell Changes */}
        {selectedVersionDiff.cellChanges &&
          selectedVersionDiff.cellChanges.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-orange-200 pt-3">
              <div className="text-sm font-medium text-orange-800">
                Detailed Cell Changes:
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {selectedVersionDiff.cellChanges.map((change, index) => (
                  <div
                    key={index}
                    className="rounded border bg-gray-50 p-2 text-xs"
                  >
                    <div className="mb-1 font-medium text-gray-700">
                      <button
                        onClick={() => onCellClick?.(change.cellRef)}
                        className="mr-2 cursor-pointer rounded border border-blue-200 bg-blue-50 px-2 py-1 font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        title={`Click to highlight cell ${change.cellRef} in the editor`}
                      >
                        {change.cellRef}
                      </button>
                      <span
                        className={`ml-2 rounded px-1 text-xs ${
                          change.changeType === "added" ?
                            "bg-green-100 text-green-700"
                          : change.changeType === "deleted" ?
                            "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {change.changeType}
                      </span>
                      
                      {/* User and timestamp information */}
                      {change.editedBy && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span className="mr-1">👤</span>
                          <span className="font-medium">{change.editedBy}</span>
                          {change.timestamp && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{new Date(change.timestamp).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {change.previousContent && (
                        <div className="text-red-600">
                          <span className="font-mono">- "</span>
                          <span className="rounded bg-red-50 px-1">
                            {change.previousContent}
                          </span>
                          <span className="font-mono">"</span>
                        </div>
                      )}
                      {change.currentContent && (
                        <div className="text-green-600">
                          <span className="font-mono">+ "</span>
                          <span className="rounded bg-green-50 px-1">
                            {change.currentContent}
                          </span>
                          <span className="font-mono">"</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Cell Change Summary (fallback) */}
        {selectedVersionDiff.cellInfo && !selectedVersionDiff.cellChanges && (
          <div className="mt-3 space-y-2 border-t border-orange-200 pt-3">
            <div className="text-sm font-medium text-orange-800">
              Cell Changes Summary:
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedVersionDiff.cellInfo.currentCellRef && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                  Active: {selectedVersionDiff.cellInfo.currentCellRef}
                </span>
              )}
              {selectedVersionDiff.cellInfo.editedCells &&
                selectedVersionDiff.cellInfo.editedCells.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                    📝 {selectedVersionDiff.cellInfo.editedCells.length} cells
                    edited
                  </span>
                )}
            </div>
            {selectedVersionDiff.cellInfo.editedCells &&
              selectedVersionDiff.cellInfo.editedCells.length > 0 && (
                <div className="text-xs text-orange-600">
                  Modified cells:{" "}
                  {selectedVersionDiff.cellInfo.editedCells
                    .slice(0, 10)
                    .join(", ")}
                  {selectedVersionDiff.cellInfo.editedCells.length > 10 &&
                    ` and ${selectedVersionDiff.cellInfo.editedCells.length - 10} more`}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Preview Content */}
      <div className="max-h-[500px] overflow-y-auto p-4">
        {diffData && diffData.length > 0 ?
          <div className="space-y-0 font-mono text-sm">
            {diffData.map((line, index) => (
              <div
                key={index}
                className={`flex px-2 py-1 ${
                  line.type === "added" ? "bg-green-100 text-green-800"
                  : line.type === "removed" ? "bg-red-100 text-red-800"
                  : "bg-gray-50 text-gray-700"
                }`}
              >
                <span className="mr-4 w-8 text-right text-gray-500">
                  {line.lineNumber || index + 1}
                </span>
                <span className="mr-2 w-4 text-center">
                  {line.type === "added" ?
                    "+"
                  : line.type === "removed" ?
                    "-"
                  : " "}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-words">
                  {line.content || " "}
                </span>
              </div>
            ))}
          </div>
        : previewEditor ?
          <EditorContent
            editor={previewEditor}
            className="[&_.ProseMirror]:outline-none"
          />
        : <div className="py-8 text-center text-gray-500">
            No preview available
          </div>
        }
      </div>

      {/* Preview Actions */}
      <div className="border-t border-orange-200 bg-orange-100 p-4">
        <div className="flex gap-3">
          <button
            onClick={onApplyVersion}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply This Version
          </button>
          <button
            onClick={onDiscardVersion}
            className="flex-1 rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
          >
            Keep Current Version
          </button>
        </div>
        <p className="mt-2 text-xs text-orange-600">
          Apply will replace your current document with this version
        </p>
      </div>
    </div>
  );
};

export default VersionPreview;
