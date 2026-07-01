export type LiveChatSenderType = "member" | "leader" | "admin";

export type LiveChatMessage = {
  id: string;
  thread_id: string;
  sender_type: LiveChatSenderType;
  sender_member_id: string | null;
  sender_name: string;
  body: string;
  created_at: string;
};

export type LiveChatThread = {
  id: string;
  member_id: string;
  status: "open" | "closed";
  subject: string;
  last_message_at: string;
  created_at: string;
  member?: { id: string; name: string; email: string; role: string };
  assigned_leaders?: { id: string; name: string }[];
  last_message?: string | null;
  unread?: boolean;
};
