export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string;
  blocked: boolean;
  createdAt: number;
  lastSeen: number;
};

export type Attachment = {
  type: "image" | "video";
  url: string;
  name: string;
};

export type Message = {
  id: string;
  authorId: string;
  authorName: string;
  avatarColor: string;
  avatarUrl?: string;
  text: string;
  attachment?: Attachment;
  timestamp: number;
};

export type Channel = {
  id: string;
  name: string;
  topic: string;
  isGroup: boolean;
  isPrivate: boolean;
  createdBy: string;
  createdById: string;
  members: string[];
  memberIds: string[];
  messages: Message[];
  archived: boolean;
};