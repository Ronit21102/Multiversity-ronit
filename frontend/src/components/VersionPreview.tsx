import React from "react";

import { Editor, EditorContent } from "@tiptap/react";

import { VersionDiff } from "../types/editor";

interface VersionPreviewProps {
  showVersionPreview: boolean;
  selectedVersionDiff: VersionDiff | null;
  previewEditor: Editor | null;
  onApplyVersion: () => void;
  onDiscardVersion: () => void;
}

const VersionPreview: React.FC<VersionPreviewProps> = ({
  showVersionPreview,
  selectedVersionDiff,
  previewEditor,
  onApplyVersion,
  onDiscardVersion,
}) => {
  if (!showVersionPreview || !selectedVersionDiff || !previewEditor) {
    return null;
  }

  return (
    <div className="w-1/2 rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
      {/* Preview Header */}
      <div className="border-b border-orange-200 bg-orange-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-900">
            📄 Version {selectedVersionDiff.versionId} Preview
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
          Read-only preview of version content
        </p>
      </div>

      {/* Preview Content */}
      <div className="max-h-[500px] overflow-y-auto p-4">
        <EditorContent
          editor={previewEditor}
          className="[&_.ProseMirror]:outline-none"
        />
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
