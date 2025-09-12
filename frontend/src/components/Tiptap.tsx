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
import { parseCellReference } from "@/utils/cellReference";
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

  // Cell highlighting function
  const highlightCell = useCallback(
    (cellRef: string) => {
      console.log("Highlighting cell:", cellRef);
      if (!editor) {
        console.log("No editor available");
        return;
      }

      const position = parseCellReference(cellRef);
      if (!position) {
        console.warn(`Invalid cell reference: ${cellRef}`);
        return;
      }

      try {
        // Focus the editor first
        editor.commands.focus();

        // Find and highlight the cell in the DOM
        setTimeout(() => {
          const editorElement = editor.view.dom;
          const tables = editorElement.querySelectorAll("table");
          console.log('Tables found:', tables.length);

          if (tables.length > 0) {
            const table = tables[0]; // Assume first table for now
            const rows = table.querySelectorAll("tr");
            console.log('Rows found:', rows.length, 'Looking for row:', position.row);

            // Try different row indices to find the right cell
            // For A3, we want the 3rd row of data, which could be at different indices
            let foundCell = null;
            let targetRowIndex = -1;
            
            // Try different row indices (0-based, 1-based, etc.)
            for (let tryRow = 0; tryRow < rows.length; tryRow++) {
              const testRow = rows[tryRow];
              const testCells = testRow.querySelectorAll("td, th");
              
              console.log(`Trying row ${tryRow}: has ${testCells.length} cells`);
              
              if (testCells.length > position.col) {
                const testCell = testCells[position.col];
                console.log(`Row ${tryRow}, Col ${position.col} content:`, testCell.textContent?.trim());
                
                // For A3, if we find a row that might be our target, use it
                if (tryRow === position.row || tryRow === position.row + 1) {
                  foundCell = testCell;
                  targetRowIndex = tryRow;
                  break;
                }
              }
            }

            if (foundCell) {
              const targetCell = foundCell;
              console.log(
                "Found target cell:",
                targetCell,
                "at row:",
                targetRowIndex,
                "col:",
                position.col,
              );

              // Clear any existing highlights
              editorElement
                .querySelectorAll(".cell-highlight")
                .forEach((el) => {
                  const htmlEl = el as HTMLElement;
                  htmlEl.classList.remove("cell-highlight");
                  htmlEl.style.backgroundColor = "";
                  htmlEl.style.border = "";
                  htmlEl.style.boxShadow = "";
                  htmlEl.style.transform = "";
                  htmlEl.style.zIndex = "";
                  htmlEl.style.position = "";
                  htmlEl.style.transition = "";
                });

              // Add aggressive blue highlight to target cell
              const htmlTargetCell = targetCell as HTMLElement;
              htmlTargetCell.classList.add("cell-highlight");
              
              // Apply very visible highlight
              htmlTargetCell.style.backgroundColor = "#3b82f6"; // Bright blue
              htmlTargetCell.style.border = "4px solid #f59e0b"; // Orange border
              htmlTargetCell.style.boxShadow = "0 0 20px rgba(245, 158, 11, 0.8)"; // Orange glow
              htmlTargetCell.style.transform = "scale(1.05)"; // Slightly larger
              htmlTargetCell.style.zIndex = "1000"; // Bring to front
              htmlTargetCell.style.position = "relative";
              htmlTargetCell.style.transition = "all 0.3s ease";
              
              console.log('Applied highlight styles to cell:', htmlTargetCell);

              // Scroll cell into view
              targetCell.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });

              // Remove highlight after 3 seconds
              setTimeout(() => {
                htmlTargetCell.classList.remove("cell-highlight");
                htmlTargetCell.style.backgroundColor = "";
                htmlTargetCell.style.border = "";
                htmlTargetCell.style.boxShadow = "";
                htmlTargetCell.style.transform = "";
                htmlTargetCell.style.zIndex = "";
                htmlTargetCell.style.position = "";
                htmlTargetCell.style.transition = "";
                console.log('Removed highlight from cell');
              }, 3000);

              console.log(
                `Successfully highlighted cell ${cellRef} at row ${targetRowIndex}, col ${position.col}`,
              );
            } else {
              console.warn(`No suitable cell found for ${cellRef}`);
            }
          } else {
            console.warn("No table found in editor");
          }
        }, 100);
      } catch (error) {
        console.error("Error highlighting cell:", error);
      }
    },
    [editor],
  );

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
          onCellClick={highlightCell}
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
