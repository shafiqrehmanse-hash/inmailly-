-- Reply Assistant: AI thread replies from LinkedIn conversation screenshots

alter table lead_messages
  add column if not exists ai_generated boolean not null default false,
  add column if not exists from_screenshot boolean not null default false;

insert into settings (key, value)
values ('reply_assistant_meeting_link', '')
on conflict (key) do nothing;
