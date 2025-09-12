import React, { useCallback, useEffect } from "react";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { CharacterCount } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";

import { CellReferenceExtension } from "@/extensions/CellReferenceExtension";
import {
  useCurrentUser,
  useOnlineUsers,
  useProviderStatus,
  useVersionManagement,
} from "@/hooks/useEditor";
import { getCurrentCellReference } from "@/utils/cellReference";
import { defaultContent } from "@/utils/constants";
import { createCollaborationCursor } from "@/utils/cursor";

import { EditorProps } from "../types/editor";
import DynamicTableStyles from "./DynamicTableStyles";
import EditorToolbar from "./EditorToolbar";
import OnlineUsers from "./OnlineUsers";
import VersionPreview from "./VersionPreview";
import VersionSidebar from "./VersionSidebar";

// =============================================================================
// MAIN EDITOR COMPONENT
// =============================================================================

const Editor: React.FC<EditorProps> = ({ ydoc, provider, room }) => {
  // Connection status
  const status = useProviderStatus(provider);

  // Main editor configuration
  const editor = useEditor({
    enableContentCheck: true,
    onContentError: ({ disableCollaboration }) => {
      disableCollaboration();
    },
    onCreate: ({ editor: currentEditor }) => {
      provider.on("synced", () => {
        if (currentEditor.isEmpty) {
          currentEditor.commands.setContent(defaultContent);
        }
      });
    },
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Highlight,
      TaskList,
      TaskItem,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount.extend().configure({
        limit: 10000,
      }),
      Collaboration.extend().configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        //user presence
        provider,
        user: { name: "Loading...", color: "#000000" }, // Temporary user until real user is set
        render: createCollaborationCursor,
      }),
      CellReferenceExtension,
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  // User management (now depends on editor)
  const { currentUser, setName } = useCurrentUser(editor);

  // Update editor user when currentUser changes
  useEffect(() => {
    if (editor && currentUser) {
      editor.chain().focus().updateUser(currentUser).run();
    }
  }, [editor, currentUser]);

  // Online users management
  const onlineUsers = useOnlineUsers(editor, currentUser);

  // Version management
  const {
    showVersionSidebar,
    versions,
    loadingVersions,
    selectedVersionDiff,
    showVersionPreview,
    previewDoc,
    diffData,
    saveDocument,
    fetchVersionHistory,
    openVersionSidebar,
    viewVersionChanges,
    closeVersionSidebar,
    setShowVersionPreview,
    setSelectedVersionDiff,
    setPreviewDoc,
  } = useVersionManagement(room, provider, currentUser);

  // Preview editor for version comparison
  const dynamicPreviewEditor = useEditor(
    {
      editable: false,
      extensions: [
        StarterKit,
        Highlight,
        TaskList,
        TaskItem,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Collaboration.extend().configure({
          document: previewDoc || new Y.Doc(),
        }),
      ],
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none",
        },
      },
    },
    [previewDoc],
  );

  // Version actions
  const applyVersionChanges = useCallback(async () => {
    if (selectedVersionDiff && editor) {
      const temp = new Y.Doc();
      Y.applyUpdate(temp, new Uint8Array(selectedVersionDiff.currentState));
      try {
        ydoc.transact(() => {
          const currentFragment = ydoc.getXmlFragment("default");
          const restoredFragment = temp.getXmlFragment("default");
          if (currentFragment.length > 0) {
            currentFragment.delete(0, currentFragment.length);
          }

          // Insert restored content
          if (restoredFragment.length > 0) {
            // Clone the content from restored document, filtering out YXmlHook items
            const restoredContent = restoredFragment
              .toArray()
              .filter(
                (item) =>
                  item instanceof Y.XmlElement || item instanceof Y.XmlText,
              );
            restoredContent.forEach((item, index) => {
              currentFragment.insert(index, [item.clone()]);
            });
          }
        }); //atomic update
        setShowVersionPreview(false);
        setSelectedVersionDiff(null);
        setPreviewDoc(null);
        console.log("✅ Version applied by directly updating Y.js document");
      } catch (error) {
        console.error("Error applying version:", error);
        alert("Failed to apply version. Please try refreshing the page.");
      }
    }
  }, [
    selectedVersionDiff,
    editor,
    ydoc,
    setShowVersionPreview,
    setSelectedVersionDiff,
    setPreviewDoc,
  ]);

  const discardVersionChanges = useCallback(() => {
    setShowVersionPreview(false);
    setSelectedVersionDiff(null);
  }, [setShowVersionPreview, setSelectedVersionDiff]);

  // Early return if editor is not ready
  if (!editor) {
    return null;
  }

  return (
    <>
      <DynamicTableStyles maxColumns={100} />
      <div className="mx-auto flex w-full max-w-7xl gap-4">
        {/* Main Editor */}
        <div
          className={`${showVersionPreview ? "w-1/2" : "flex-1"} rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300`}
        >
          {/* Online Users Header */}
          <OnlineUsers
            onlineUsers={onlineUsers}
            currentUser={currentUser}
            status={status}
          />

          {/* Toolbar */}
          <EditorToolbar
            editor={editor}
            currentUser={currentUser}
            onSave={saveDocument}
            onVersionHistory={openVersionSidebar}
            onChangeName={setName}
          />

          {/* Editor Content */}
          <div className="prose prose-sm max-w-none">
            <EditorContent
              editor={editor}
              className="min-h-[500px] p-4 focus:outline-none [&_.ProseMirror]:min-h-[450px] [&_.ProseMirror]:outline-none [&_.ProseMirror_.column-resize-handle]:pointer-events-none [&_.ProseMirror_.column-resize-handle]:absolute [&_.ProseMirror_.column-resize-handle]:bottom-0 [&_.ProseMirror_.column-resize-handle]:right-[-2px] [&_.ProseMirror_.column-resize-handle]:top-0 [&_.ProseMirror_.column-resize-handle]:w-1 [&_.ProseMirror_.column-resize-handle]:bg-blue-500 [&_.ProseMirror_.resize-cursor]:cursor-col-resize [&_.ProseMirror_.selectedCell]:bg-blue-100 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_em]:italic [&_.ProseMirror_p]:my-2 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_table]:mb-4 [&_.ProseMirror_table]:mt-4 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:table-auto [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:relative [&_.ProseMirror_td]:min-w-[1em] [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:relative [&_.ProseMirror_th]:min-w-[1em] [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:bg-gray-50 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc"
            />
          </div>
        </div>

        {/* Version Changes Preview Panel */}
        <VersionPreview
          showVersionPreview={showVersionPreview}
          selectedVersionDiff={selectedVersionDiff}
          previewEditor={dynamicPreviewEditor}
          diffData={diffData}
          onApplyVersion={applyVersionChanges}
          onDiscardVersion={discardVersionChanges}
        />

        {/* Version History Sidebar */}
        <VersionSidebar
          showVersionSidebar={showVersionSidebar}
          versions={versions}
          loadingVersions={loadingVersions}
          selectedVersionDiff={selectedVersionDiff}
          showVersionPreview={showVersionPreview}
          onClose={closeVersionSidebar}
          onRefresh={fetchVersionHistory}
          onViewVersion={viewVersionChanges}
        />
      </div>
    </>
  );
};

export default Editor;
