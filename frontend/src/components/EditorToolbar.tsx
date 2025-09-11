import React from "react";

import { Editor } from "@tiptap/react";

import { User } from "../types/editor";

interface EditorToolbarProps {
  editor: Editor;
  currentUser: User;
  onSave: () => void;
  onVersionHistory: () => void;
  onChangeName: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  currentUser,
  onSave,
  onVersionHistory,
  onChangeName,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex h-8 w-8 items-center justify-center rounded text-sm font-semibold transition-all duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            editor.isActive("bold") ?
              "border border-blue-300 bg-blue-100 text-blue-700"
            : "border border-gray-300 bg-white text-gray-700"
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex h-8 w-8 items-center justify-center rounded text-sm font-semibold italic transition-all duration-200 hover:bg-gray-200 ${
            editor.isActive("italic") ?
              "border border-blue-300 bg-blue-100 text-blue-700"
            : "border border-gray-300 bg-white text-gray-700"
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`flex h-8 w-8 items-center justify-center rounded text-sm font-semibold line-through transition-all duration-200 hover:bg-gray-200 ${
            editor.isActive("strike") ?
              "border border-blue-300 bg-blue-100 text-blue-700"
            : "border border-gray-300 bg-white text-gray-700"
          }`}
          title="Strike"
        >
          S
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex h-8 w-8 items-center justify-center rounded text-xs transition-all duration-200 hover:bg-gray-200 ${
            editor.isActive("bulletList") ?
              "border border-blue-300 bg-blue-100 text-blue-700"
            : "border border-gray-300 bg-white text-gray-700"
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`flex h-8 w-8 items-center justify-center rounded font-mono text-xs transition-all duration-200 hover:bg-gray-200 ${
            editor.isActive("code") ?
              "border border-blue-300 bg-blue-100 text-blue-700"
            : "border border-gray-300 bg-white text-gray-700"
          }`}
          title="Code"
        >
          &lt;/&gt;
        </button>

        {/* Table Controls */}
        <div className="mx-2 h-6 w-px bg-gray-300"></div>
        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200"
          title="Insert Table"
        >
          ⊞
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Add Column Before"
        >
          ⊏
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Add Column After"
        >
          ⊐
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Delete Column"
        >
          ⊟
        </button>
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Add Row Before"
        >
          ⊤
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Add Row After"
        >
          ⊥
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Delete Row"
        >
          ⊝
        </button>
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-50 text-xs text-red-700 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50"
          title="Delete Table"
        >
          🗑
        </button>
      </div>

      {/* Status Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onVersionHistory}
          className="flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-100"
        >
          📄 Version History
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-1 text-sm text-green-700 transition-colors hover:bg-green-100"
        >
          💾 Save
        </button>
        <button
          onClick={onChangeName}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm transition-colors hover:bg-gray-50"
          style={{ borderColor: currentUser.color }}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: currentUser.color }}
          />
          Change Name
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
