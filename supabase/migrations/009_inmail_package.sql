-- InMail package quota per project (client progress bar: 1 screenshot = 1 InMail)
alter table projects add column if not exists inmail_package_size integer;

alter table projects drop constraint if exists projects_inmail_package_size_check;
alter table projects add constraint projects_inmail_package_size_check
  check (inmail_package_size is null or inmail_package_size > 0);
