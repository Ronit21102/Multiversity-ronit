import React, { useEffect, useState } from "react";

import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import Editor from "./components/Tiptap"; // Make sure this is correct

const App: React.FC = () => {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const room = "example-document";

  useEffect(() => {
    console.log("Creating HocusPocus provider..."); // Debug log

    const hocuspocusProvider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: room,
      document: ydoc,
    });

    // Add event listeners after provider creation
    hocuspocusProvider.on("connect", () => {
      console.log("HocusPocus connected!");
    });

    hocuspocusProvider.on("disconnect", () => {
      console.log("HocusPocus disconnected!");
    });

    hocuspocusProvider.on("status", (event: any) => {
      console.log("HocusPocus status:", event);
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
    };
  }, [ydoc, room]);

  if (!provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Connecting to collaboration server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 text-center text-3xl font-bold">
          Collaborative Editor
        </h1>
        <Editor ydoc={ydoc} provider={provider} room={room} />
      </div>
    </div>
  );
};

export default App;

