export interface Document {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  collaborators?: string[];
}
