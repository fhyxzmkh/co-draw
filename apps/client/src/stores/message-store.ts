export type Invitation = {
  id: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  content: string;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
  resourceId: string;
  resourceType: string;
};
