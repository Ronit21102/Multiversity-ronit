import { useCallback, useEffect, useState } from "react";

import * as Y from "yjs";

import { User, Version, VersionDiff } from "../types/editor";

// Utility function to extract plain text from Y.XmlFragment
const extractTextFromFragment = (fragment: Y.XmlFragment): string => {
  try {
    // Convert Y.js fragment to a simple text representation
    console.log("Fragment:", fragment);
    const json = fragment.toJSON();
    console.log("Fragment JSON:", json);
    console.log("typeof json:", typeof json);

    if (typeof json === "string") {
      // Parse the XML-like string to extract text content
      return parseXmlToText(json);
    }

    console.log("Fragment JSON:", json);
    // If it's an object/array, try to extract text content
    const extractText = (obj: any): string => {
      if (typeof obj === "string") {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(extractText).join("");
      }
      if (obj && typeof obj === "object") {
        if (obj.text) return obj.text;
        if (obj.content) return extractText(obj.content);
        return Object.values(obj).map(extractText).join("");
      }
      return "";
    };

    return extractText(json);
  } catch (error) {
    console.warn("Failed to extract text from fragment:", error);
    return fragment.toString();
  }
};

// Helper function to parse XML-like string and extract text content
const parseXmlToText = (xmlString: string): string => {
  try {
    // Simple regex-based approach to extract text content from XML-like tags
    let text = xmlString;

    // Handle different tag types and extract their text content
    text = text
      // Extract text from heading tags
      .replace(/<heading[^>]*>(.*?)<\/heading>/g, "$1\n")
      // Extract text from paragraph tags
      .replace(/<paragraph[^>]*>(.*?)<\/paragraph>/g, "$1\n")
      // Extract text from table cells and headers
      .replace(/<tableheader[^>]*>(.*?)<\/tableheader>/g, "$1\t")
      .replace(/<tablecell[^>]*>(.*?)<\/tablecell>/g, "$1\t")
      // Remove table structure tags but keep content
      .replace(/<table[^>]*>/g, "")
      .replace(/<\/table>/g, "\n")
      .replace(/<tablerow[^>]*>/g, "")
      .replace(/<\/tablerow>/g, "\n")
      // Handle hard breaks
      .replace(/<hardbreak[^>]*><\/hardbreak>/g, "\n")
      // Remove any remaining tags
      .replace(/<[^>]*>/g, "")
      // Clean up multiple newlines and whitespace
      .replace(/\n\s*\n/g, "\n")
      .replace(/\t+/g, " ")
      .trim();

    return text;
  } catch (error) {
    console.warn("Failed to parse XML string:", error);
    return xmlString;
  }
};

// Utility function to compute text diff
const computeTextDiff = (oldText: string, newText: string) => {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const diff: Array<{
    type: "added" | "removed" | "unchanged";
    content: string;
    lineNumber?: number;
  }> = [];

  // Simple line-by-line diff (you could use a more sophisticated algorithm)
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) {
      // Line added
      diff.push({ type: "added", content: newLine, lineNumber: i + 1 });
    } else if (newLine === undefined) {
      // Line removed
      diff.push({ type: "removed", content: oldLine, lineNumber: i + 1 });
    } else if (oldLine === newLine) {
      // Line unchanged
      diff.push({ type: "unchanged", content: newLine, lineNumber: i + 1 });
    } else {
      // Line changed - show as removed + added
      diff.push({ type: "removed", content: oldLine, lineNumber: i + 1 });
      diff.push({ type: "added", content: newLine, lineNumber: i + 1 });
    }
  }

  return diff;
};

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
  const [diffData, setDiffData] = useState<Array<{
    type: "added" | "removed" | "unchanged";
    content: string;
    lineNumber?: number;
  }> | null>(null);

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

          // Compute text diff for preview
          console.log("yaha");
          const currentText = extractTextFromFragment(currentFragment);
          const previousText = extractTextFromFragment(previousFragment);
          const diff = computeTextDiff(previousText, currentText);
          setDiffData(diff);

          console.log("📊 Computed diff:", diff);
        } else {
          // No previous version, show current as all additions
          const currentFragment = currentDoc.get("default", Y.XmlFragment);
          const currentText = extractTextFromFragment(currentFragment);
          const diff = currentText
            .split("\n")
            .map((line: string, index: number) => ({
              type: "added" as const,
              content: line,
              lineNumber: index + 1,
            }));
          setDiffData(diff);
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
    setDiffData(null);
  }, []);

  return {
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
  };
};
