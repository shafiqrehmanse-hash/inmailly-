export type TeamMember = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: "member" | "senior" | "admin";
  is_active: boolean;
  invite_code: string | null;
  joined_at: string;
  last_login: string | null;
};

export type OutreachLink = {
  id: string;
  url: string;
  url_key: string;
  smart_label: string | null;
  category: "linkedin" | "salesnav" | "email" | "general";
  batch_name: string | null;
  status: "available" | "claimed" | "used";
  member_id: string | null;
  claimed_at: string | null;
  used_at: string | null;
  used_by_member_id: string | null;
  ai_hint: string | null;
  notes: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  member_id: string;
  name: string;
  profile_url: string | null;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  status: "new" | "contacted" | "replied" | "interested" | "closed" | "dead";
  deal_closed: boolean;
  closed_at: string | null;
  notes: string | null;
  source_link_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadMessage = {
  id: string;
  lead_id: string;
  sender: "team" | "lead";
  sender_name: string;
  msg_type: "message" | "followup" | "reply" | "inmail" | "note";
  content: string;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_name: string | null;
  status: "pending" | "joined" | "converted";
  reward_pkr: number;
  created_at: string;
};

export type MemberFund = {
  id: string;
  member_id: string;
  amount_pkr: number;
  note: string;
  added_by: string;
  added_at: string;
};

export type InviteCode = {
  id: string;
  code: string;
  label: string | null;
  uses_left: number;
  used_count: number;
  created_at: string;
};
