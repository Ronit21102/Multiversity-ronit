import React from "react";

import { Clock, FileText, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Document } from "../types/document";

interface DocumentListProps {
  documents: Document[];
  onCreateDocument: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onCreateDocument,
}) => {
  const navigate = useNavigate();

  const handleDocumentClick = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="mt-2 text-gray-600">
              Manage your collaborative documents
            </p>
          </div>
          <button
            onClick={onCreateDocument}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </button>
        </div>

        {documents.length === 0 ?
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No documents yet
            </h3>
            <p className="mb-6 text-gray-600">
              Create your first collaborative document to get started.
            </p>
            <button
              onClick={onCreateDocument}
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Document
            </button>
          </div>
        : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <div
                key={document.id}
                onClick={() => handleDocumentClick(document.id)}
                className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-3 h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Updated {formatDate(document.updatedAt)}</span>
                  </div>

                  {document.collaborators &&
                    document.collaborators.length > 0 && (
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>
                          {document.collaborators.length} collaborator
                          {document.collaborators.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-400">
                    Created {formatDate(document.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
};

export default DocumentList;
