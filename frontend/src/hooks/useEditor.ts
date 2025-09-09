import { useCallback, useEffect, useState } from "react";

import * as Y from "yjs";

import { User, Version, VersionDiff } from "../types/editor";

// Hook for managing provider connection status
export const useProviderStatus = (provider: any) => {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  useEffect(() => {
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

  return status;
};

// Hook for managing current user
export const useCurrentUser = (editor: any) => {
  const getInitialUser = (): User => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        // Fall back to random user if parsing fails
      }
    }

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"];
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];

    const getRandomElement = (list: string[]): string =>
      list[Math.floor(Math.random() * list.length)];

    return {
      name: getRandomElement(names),
      color: getRandomElement(colors),
    };
  };

  const [currentUser, setCurrentUser] = useState<User>(getInitialUser);

  useEffect(() => {
    if (editor && currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      editor.chain().focus().updateUser(currentUser).run();
    }
  }, [editor, currentUser]);

  const setName = useCallback(() => {
    const name = (window.prompt("Name", currentUser.name) || "")
      .trim()
      .substring(0, 32);

    if (name) {
      return setCurrentUser({ ...currentUser, name });
    }
  }, [currentUser]);

  return { currentUser, setCurrentUser, setName };
};

// Hook for managing online users
export const useOnlineUsers = (editor: any, currentUser: User) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    if (editor) {
      const updateUsers = () => {
        const collaborationUsers =
          editor.storage.collaborationCaret?.users || [];
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

      editor.on("transaction", updateUsers);

      return () => {
        editor.off("transaction", updateUsers);
      };
    }
  }, [editor, currentUser.name]);

  return onlineUsers;
};

// Hook for version management
export const useVersionManagement = (
  room: string,
  provider: any,
  currentUser: User,
) => {
  const [showVersionSidebar, setShowVersionSidebar] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersionDiff, setSelectedVersionDiff] =
    useState<VersionDiff | null>(null);
  const [showVersionPreview, setShowVersionPreview] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Y.Doc | null>(null);

  const saveDocument = useCallback(() => {
    console.log("🔍 Save button clicked");

    if (provider) {
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
        const response = await fetch(
          `http://localhost:3001/api/versions/${room}/${versionId}/diff`,
        );
        const snapshotData = (await response.json()) as VersionDiff;
        setSelectedVersionDiff(snapshotData);

        const currentDoc = new Y.Doc();
        Y.applyUpdate(currentDoc, new Uint8Array(snapshotData.currentState));

        if (snapshotData.previousSnapshot && snapshotData.previousState) {
          const previousDoc = new Y.Doc();
          Y.applyUpdate(
            previousDoc,
            new Uint8Array(snapshotData.previousState),
          );

          const currentSnapshot = Y.decodeSnapshot(
            new Uint8Array(snapshotData.currentSnapshot),
          );
          const previousSnapshot = Y.decodeSnapshot(
            new Uint8Array(snapshotData.previousSnapshot),
          );

          console.log("📊 Y.js snapshots available for diffing");
          console.log("Current snapshot:", currentSnapshot);
          console.log("Previous snapshot:", previousSnapshot);

          const currentFragment = currentDoc.get("default", Y.XmlFragment);
          const previousFragment = previousDoc.get("default", Y.XmlFragment);

          console.log("Current Y.js XML:", currentFragment.toString());
          console.log("Previous Y.js XML:", previousFragment.toString());
          console.log("Current JSON content:", currentFragment.toJSON());
          console.log("Previous JSON content:", previousFragment.toJSON());
        }

        setPreviewDoc(currentDoc);
        setShowVersionPreview(true);
      } catch (error) {
        console.error("Error fetching version snapshots:", error);
      }
    },
    [room],
  );

  const closeVersionSidebar = useCallback(() => {
    setShowVersionSidebar(false);
    setShowVersionPreview(false);
    setSelectedVersionDiff(null);
  }, []);

  return {
    showVersionSidebar,
    versions,
    loadingVersions,
    selectedVersionDiff,
    showVersionPreview,
    previewDoc,
    saveDocument,
    fetchVersionHistory,
    openVersionSidebar,
    viewVersionChanges,
    closeVersionSidebar,
    setShowVersionPreview,
    setSelectedVersionDiff,
    setPreviewDoc,
  };
};
