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

export type LiveChatPerson = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  last_login?: string | null;
  is_online?: boolean;
};

export type LiveChatThread = {
  id: string;
  member_id: string;
  status: "open" | "closed";
  subject: string;
  last_message_at: string;
  created_at: string;
  member?: LiveChatPerson;
  assigned_leaders?: LiveChatPerson[];
  last_message?: string | null;
  unread?: boolean;
};

/** Active in the last 5 minutes counts as online. */
export function isRecentlyOnline(lastLogin?: string | null, withinMs = 5 * 60 * 1000) {
  if (!lastLogin) return false;
  const t = new Date(lastLogin).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < withinMs;
}
