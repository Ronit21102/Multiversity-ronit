import React from "react";

import { Version, VersionDiff } from "../types/editor";

interface VersionSidebarProps {
  showVersionSidebar: boolean;
  versions: Version[];
  loadingVersions: boolean;
  selectedVersionDiff: VersionDiff | null;
  showVersionPreview: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onViewVersion: (versionId: number) => void;
}

const VersionSidebar: React.FC<VersionSidebarProps> = ({
  showVersionSidebar,
  versions,
  loadingVersions,
  selectedVersionDiff,
  showVersionPreview,
  onClose,
  onRefresh,
  onViewVersion,
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!showVersionSidebar) {
    return null;
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50">
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Version History
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Refresh versions"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingVersions ?
            <div className="py-8 text-center text-gray-500">
              <div className="text-sm">Loading versions...</div>
            </div>
          : versions.length === 0 ?
            <div className="py-8 text-center text-gray-500">
              <div className="text-sm">No versions saved yet</div>
              <div className="mt-2 text-xs text-gray-400">
                Save your document to create the first version
              </div>
            </div>
          : <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md ${
                    (
                      selectedVersionDiff?.versionId === version.id &&
                      showVersionPreview
                    ) ?
                      "border-orange-300 bg-orange-50"
                    : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {version.name}
                        {version.cellInfo?.currentCellRef && (
                          <span className="ml-2 rounded bg-blue-100 px-1 text-xs text-blue-600">
                            {version.cellInfo.currentCellRef}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatTimestamp(version.timestamp)}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        by {version.savedBy}
                      </div>
                      {/* Cell Information Display */}
                      {version.cellInfo && (
                        <div className="mt-2 space-y-1">
                          {version.cellInfo.currentCellRef && (
                            <div className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
                              📍 Active: {version.cellInfo.currentCellRef}
                            </div>
                          )}
                          {version.cellInfo.editedCells &&
                            version.cellInfo.editedCells.length > 0 && (
                              <div className="text-xs text-green-600">
                                📝 Edited {version.cellInfo.editedCells.length}{" "}
                                cells:{" "}
                                {version.cellInfo.editedCells
                                  .slice(0, 3)
                                  .join(", ")}
                                {version.cellInfo.editedCells.length > 3 ?
                                  "..."
                                : ""}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                  {version.id > 1 && (
                    <div>
                      <button
                        onClick={() => onViewVersion(version.id)}
                        className={`mt-2 w-full rounded px-2 py-1 text-xs transition-colors ${
                          (
                            selectedVersionDiff?.versionId === version.id &&
                            showVersionPreview
                          ) ?
                            "bg-orange-200 text-orange-800"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        {(
                          selectedVersionDiff?.versionId === version.id &&
                          showVersionPreview
                        ) ?
                          "Previewing Changes"
                        : "Preview Changes"}
                      </button>
                      
                      {/* Show detailed cell changes summary when this version is selected */}
                      {selectedVersionDiff?.versionId === version.id && 
                       selectedVersionDiff.cellChanges && 
                       selectedVersionDiff.cellChanges.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium text-gray-700 mb-1">
                            🔍 Detailed Changes:
                          </div>
                          {selectedVersionDiff.cellChanges.slice(0, 3).map((change, idx) => (
                            <div key={idx} className="text-xs text-gray-600 mb-1">
                              <span className="font-mono font-medium">{change.cellRef}:</span>{" "}
                              <span className="text-red-500">"{change.previousContent || "empty"}"</span>
                              {" → "}
                              <span className="text-green-500">"{change.currentContent || "empty"}"</span>
                            </div>
                          ))}
                          {selectedVersionDiff.cellChanges.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{selectedVersionDiff.cellChanges.length - 3} more changes...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default VersionSidebar;
