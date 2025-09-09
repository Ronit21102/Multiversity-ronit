import React, { useState } from "react";

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import DocumentEditor from "./components/DocumentEditor";
import DocumentList from "./components/DocumentList";
import { Document } from "./types/document";

const App: React.FC = () => {
  // Sample documents - in a real app, this would come from an API
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc-1",
      title: "Project Planning Document",
      description:
        "Initial planning and roadmap for the new feature development",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-16T14:22:00Z",
      collaborators: ["Alice", "Bob", "Charlie"],
    },
    {
      id: "doc-2",
      title: "Meeting Notes",
      description: "Weekly team sync meeting notes and action items",
      createdAt: "2024-01-14T09:00:00Z",
      updatedAt: "2024-01-14T11:45:00Z",
      collaborators: ["Alice", "Bob"],
    },
    {
      id: "doc-3",
      title: "API Documentation",
      description: "Technical documentation for the REST API endpoints",
      createdAt: "2024-01-10T16:20:00Z",
      updatedAt: "2024-01-15T13:10:00Z",
      collaborators: ["Charlie", "Dave"],
    },
  ]);

  const handleCreateDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: "New Document",
      description: "A fresh collaborative document",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [],
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <DocumentList
              documents={documents}
              onCreateDocument={handleCreateDocument}
            />
          }
        />
        <Route path="/document/:documentId" element={<DocumentEditor />} />
      </Routes>
    </Router>
  );
};

export default App;

