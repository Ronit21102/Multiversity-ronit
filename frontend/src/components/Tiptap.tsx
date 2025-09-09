import React, { useCallback, useEffect, useState } from "react";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { CharacterCount } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";

import { colors, defaultContent, names } from "@/utils/constants";

import { EditorProps, User, Version, VersionDiff } from "../types/editor";
import EditorToolbar from "./EditorToolbar";
import OnlineUsers from "./OnlineUsers";
import VersionPreview from "./VersionPreview";
import VersionSidebar from "./VersionSidebar";

const getRandomElement = (list: string[]): string =>
  list[Math.floor(Math.random() * list.length)];

const getRandomColor = () => getRandomElement(colors);
const getRandomName = () => getRandomElement(names);

const getInitialUser = (): User => {
  return {
    name: getRandomName(),
    color: getRandomColor(),
  };
};

const Editor: React.FC<EditorProps> = ({ ydoc, provider, room }) => {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [currentUser, setCurrentUser] = useState<User>(getInitialUser);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [showVersionSidebar, setShowVersionSidebar] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersionDiff, setSelectedVersionDiff] =
    useState<VersionDiff | null>(null);
  const [showVersionPreview, setShowVersionPreview] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Y.Doc | null>(null);

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
      CharacterCount.extend().configure({
        limit: 10000,
      }),
      Collaboration.extend().configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider,
        user: currentUser,
        render: (user) => {
          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.style.cssText = `
            position: relative;
            margin-left: -1px;
            margin-right: -1px;
            border-left: 2px solid ${user.color};
            pointer-events: none;
            user-select: none;
            display: inline-block;
            height: 1.2em;
          `;

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.style.cssText = `
            position: absolute;
            top: -20px;
            left: -1px;
            background: ${user.color};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 1;
            pointer-events: none;
            z-index: 50;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          `;
          label.textContent = user.name;
          cursor.appendChild(label);

          return cursor;
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  // Create a read-only TipTap editor for preview with collaboration
  const previewEditor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Highlight,
      TaskList,
      TaskItem,
      // Add collaboration for Y.js content handling
      Collaboration.extend().configure({
        document: previewDoc || new Y.Doc(), // Use previewDoc or empty doc
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    // Update status changes
    const connectHandler = () => {
      console.log("Provider connected");
      setStatus("connected");
    };

    const disconnectHandler = () => {
      console.log("Provider disconnected");
      setStatus("disconnected");
    };

    const statusHandler = (event: any) => {
      console.log("Provider status changed:", event);
      setStatus(event.status || "connecting");
    };

    provider.on("connect", connectHandler);
    provider.on("disconnect", disconnectHandler);
    provider.on("status", statusHandler);

    return () => {
      provider.off("connect", connectHandler);
      provider.off("disconnect", disconnectHandler);
      provider.off("status", statusHandler);
    };
  }, [provider]);

  // Save current user to localStorage and emit to editor
  useEffect(() => {
    if (editor && currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      editor.chain().focus().updateUser(currentUser).run();
    }
  }, [editor, currentUser]);

  // Track online users
  useEffect(() => {
    if (editor) {
      const updateUsers = () => {
        const collaborationUsers =
          editor.storage.collaborationCaret?.users || [];
        // Filter and map to proper User type, excluding current user
        const filteredUsers: User[] = collaborationUsers
          .filter(
            (user: any) =>
              user.name && user.color && user.name !== currentUser.name,
          )
          .map((user: any) => ({
            name: user.name,
            color: user.color,
          }));
        setOnlineUsers(filteredUsers);
      };

      // Update users when editor content changes
      editor.on("transaction", updateUsers);

      return () => {
        editor.off("transaction", updateUsers);
      };
    }
  }, [editor, currentUser.name]);

  const setName = useCallback(() => {
    const name = (window.prompt("Name", currentUser.name) || "")
      .trim()
      .substring(0, 32);

    if (name) {
      return setCurrentUser({ ...currentUser, name });
    }
  }, [currentUser]);

  const saveDocument = useCallback(() => {
    console.log("🔍 Save button clicked");

    if (provider) {
      // Send custom save event to backend
      try {
        provider.sendStateless(
          JSON.stringify({
            type: "SAVE_DOCUMENT_CUSTOM",
            timestamp: new Date().toISOString(),
            user: currentUser.name,
          }),
        );
        console.log("✅ Custom save event sent to backend");
      } catch (error) {
        console.log("❌ Error sending save event:", error);
      }
    } else {
      console.log("❌ No provider found");
    }
  }, [provider, currentUser.name]);

  const fetchVersionHistory = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/versions/${room}`,
      );
      const data: any = await response.json();
      setVersions(data.versions);
    } catch (error) {
      console.error("Error fetching version history:", error);
    } finally {
      setLoadingVersions(false);
    }
  }, [room]);

  const openVersionSidebar = useCallback(() => {
    setShowVersionSidebar(true);
    fetchVersionHistory();
  }, [fetchVersionHistory]);

  const viewVersionChanges = useCallback(
    async (versionId: number) => {
      try {
        // Fetch Y.js snapshots from backend
        const response = await fetch(
          `http://localhost:3001/api/versions/${room}/${versionId}/diff`,
        );
        const snapshotData = (await response.json()) as VersionDiff;
        setSelectedVersionDiff(snapshotData);

        // Create Y.js document from current state
        const currentDoc = new Y.Doc();
        Y.applyUpdate(currentDoc, new Uint8Array(snapshotData.currentState));

        if (snapshotData.previousSnapshot && snapshotData.previousState) {
          const previousDoc = new Y.Doc();
          Y.applyUpdate(
            previousDoc,
            new Uint8Array(snapshotData.previousState),
          );

          // Create Y.js snapshots from the binary data
          const currentSnapshot = Y.decodeSnapshot(
            new Uint8Array(snapshotData.currentSnapshot),
          );
          const previousSnapshot = Y.decodeSnapshot(
            new Uint8Array(snapshotData.previousSnapshot),
          );

          console.log("📊 Y.js snapshots available for diffing");
          console.log("Current snapshot:", currentSnapshot);
          console.log("Previous snapshot:", previousSnapshot);

          // Get actual HTML content from Y.js documents
          const currentFragment = currentDoc.get("default", Y.XmlFragment);
          const previousFragment = previousDoc.get("default", Y.XmlFragment);

          console.log("Current Y.js XML:", currentFragment.toString());
          console.log("Previous Y.js XML:", previousFragment.toString());
          console.log("Current JSON content:", currentFragment.toJSON());
          console.log("Previous JSON content:", previousFragment.toJSON());
        }

        // Set the preview document and force re-render
        setPreviewDoc(currentDoc);

        // Recreate preview editor with new document
        if (previewEditor) {
          previewEditor.destroy();
        }

        setShowVersionPreview(true);
      } catch (error) {
        console.error("Error fetching version snapshots:", error);
      }
    },
    [room, previewEditor],
  );

  // Create preview editor when previewDoc changes
  const dynamicPreviewEditor = useEditor(
    {
      editable: false,
      extensions: [
        StarterKit,
        Highlight,
        TaskList,
        TaskItem,
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
  ); // Re-create when previewDoc changes

  const applyVersionChanges = useCallback(async () => {
    if (selectedVersionDiff && editor) {
      try {
        // Simplest approach: Apply Y.js state directly to the main document
        Y.applyUpdate(ydoc, new Uint8Array(selectedVersionDiff.currentState));

        // The Collaboration extension automatically updates the editor
        setShowVersionPreview(false);
        setSelectedVersionDiff(null);
        setPreviewDoc(null);

        console.log("✅ Version applied by directly updating Y.js document");
      } catch (error) {
        console.error("Error applying version:", error);
        alert("Failed to apply version. Please try refreshing the page.");
      }
    }
  }, [selectedVersionDiff, editor, ydoc]);

  const discardVersionChanges = useCallback(() => {
    setShowVersionPreview(false);
    setSelectedVersionDiff(null);
  }, []);

  if (!editor) {
    return null;
  }

  return (
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
            className="min-h-[500px] p-4 focus:outline-none [&_.ProseMirror]:min-h-[450px] [&_.ProseMirror]:outline-none [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_em]:italic [&_.ProseMirror_p]:my-2 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc"
          />
        </div>
      </div>

      {/* Version Changes Preview Panel */}
      <VersionPreview
        showVersionPreview={showVersionPreview}
        selectedVersionDiff={selectedVersionDiff}
        previewEditor={dynamicPreviewEditor}
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
        onClose={() => {
          setShowVersionSidebar(false);
          setShowVersionPreview(false);
          setSelectedVersionDiff(null);
        }}
        onRefresh={fetchVersionHistory}
        onViewVersion={viewVersionChanges}
      />
    </div>
  );
};

export default Editor;
