export interface BoardInfo {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  collaboratorIds: JSON;
  content: JSON;
  createdAt: string;
  updatedAt: string;
}
