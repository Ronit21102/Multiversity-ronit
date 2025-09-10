import React from "react";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber?: number;
}

interface DiffViewerProps {
  diffData: DiffLine[];
  className?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  diffData,
  className = "",
}) => {
  return (
    <div className={`font-mono text-sm ${className}`}>
      <div className="border-b bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
        Changes between versions (+ additions, - deletions)
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {diffData.map((line, index) => (
          <div
            key={index}
            className={`flex border-l-4 px-4 py-1 text-sm ${
              line.type === "added" ?
                "border-green-400 bg-green-50 text-green-800"
              : line.type === "removed" ?
                "border-red-400 bg-red-50 text-red-800"
              : "border-gray-200 bg-white text-gray-700"
            } `}
          >
            <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
              {line.type === "added" && (
                <span className="text-green-600">+</span>
              )}
              {line.type === "removed" && (
                <span className="text-red-600">-</span>
              )}
              {line.type === "unchanged" && (
                <span className="text-gray-400">&nbsp;</span>
              )}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
              {line.content || "\u00A0"}
            </span>
            {line.lineNumber && (
              <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
                {line.lineNumber}
              </span>
            )}
          </div>
        ))}
      </div>
      {diffData.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No changes detected between versions
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
