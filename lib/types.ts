export type TeamMember = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: "member" | "senior" | "admin" | "campaign_manager" | "team_leader";
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
  project_id: string | null;
  visible_to_client: boolean;
  name: string;
  profile_url: string | null;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  status: "new" | "contacted" | "replied" | "interested" | "not_interested" | "follow_up" | "closed" | "dead";
  deal_closed: boolean;
  closed_at: string | null;
  notes: string | null;
  client_followup_message: string | null;
  client_followup_at: string | null;
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

export type Client = {
  id: string;
  user_id: string | null;
  name: string;
  company_name: string | null;
  email: string | null;
  logo_url: string | null;
  notes: string | null;
  signup_source: "admin" | "self";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectStatus = "draft" | "preview" | "active" | "paused" | "completed";

export type Project = {
  id: string;
  client_id: string;
  name: string;
  audience_brief: string | null;
  target_titles: string | null;
  target_industries: string | null;
  target_regions: string | null;
  connection_script: string | null;
  inmail_script: string | null;
  followup_script: string | null;
  inmail_package_size: number | null;
  status: ProjectStatus;
  portal_token: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectAssignment = {
  id: string;
  project_id: string;
  member_id: string;
  assigned_at: string;
  assigned_by: string;
};

export type SendProof = {
  id: string;
  project_id: string;
  uploaded_by: string;
  original_path: string;
  display_path: string;
  visible_to_client: boolean;
  caption: string | null;
  created_at: string;
};

export type ProjectWithClient = Project & {
  clients: Pick<Client, "id" | "name" | "company_name" | "email" | "logo_url"> | null;
};

export type AssignedProject = ProjectWithClient & {
  assignment_id: string;
  assigned_at: string;
};

export type TeamTask = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by_member_id: string | null;
  status: "pending" | "in_progress" | "done";
  due_at: string | null;
  created_at: string;
  updated_at: string;
};
