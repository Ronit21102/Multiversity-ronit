import React, { useEffect, useState } from "react";



import { HocuspocusProvider } from "@hocuspocus/provider";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as Y from "yjs";



import Editor from "./Tiptap";


const DocumentEditor: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  //User types in Tiptap → ydoc updates → HocusPocus syncs → Other users' ydoc → Other users' Tiptap updates
  useEffect(() => {
    if (!documentId) return;

    console.log("Creating HocusPocus provider for document:", documentId);

    const hocuspocusProvider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: documentId,
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
  }, [ydoc, documentId]);

  const handleBack = () => {
    navigate("/");
  };

  if (!provider || !documentId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Connecting to collaboration server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </button>
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold">
          Collaborative Editor
        </h1>
        <Editor
          ydoc={ydoc}
          provider={provider}
          room={documentId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default DocumentEditor;