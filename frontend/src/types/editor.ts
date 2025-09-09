import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

export interface User {
  name: string;
  color: string;
}
export interface Version {
  id: number;
  name: string;
  timestamp: string;
  savedBy: string;
  filePath: string;
}

export interface EditorProps {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  room: string;
  onBack?: () => void;
}

export interface VersionDiff {
  versionId: number;
  currentSnapshot: number[];
  previousSnapshot: number[] | null;
  currentState: number[];
  previousState: number[] | null;
  timestamp: string;
  savedBy: string;
}
