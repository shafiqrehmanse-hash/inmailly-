import type { ManagedNavGroup } from "@/components/admin/managed/ManagedShell";

export const TEAM_ADMIN_NAV: ManagedNavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { href: "/admin/team", label: "Overview", icon: "◫" },
      { href: "/admin/team/performance", label: "Team performance", icon: "📊" },
      { href: "/admin/team/leads", label: "Outreach leads", icon: "📋" },
      { href: "/admin/team/responses", label: "Responses", icon: "💬" },
      { href: "/admin/team/members", label: "Team members", icon: "👥" },
    ],
  },
  {
    title: "Communicate",
    items: [
      { href: "/admin/team/email", label: "Email team", icon: "✉" },
    ],
  },
  {
    title: "Outreach",
    items: [
      { href: "/admin/team/links", label: "Work links", icon: "⛓" },
      { href: "/admin/team/scripts", label: "Daily scripts", icon: "📝" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/team/referrals", label: "Referrals", icon: "✦" },
      { href: "/admin/team/funds", label: "Funds & invite", icon: "💰" },
    ],
  },
];

export const CLIENTS_ADMIN_NAV: ManagedNavGroup[] = [
  {
    title: "Clients",
    items: [
      { href: "/admin/clients", label: "All clients", icon: "◇" },
      { href: "/admin/clients/email", label: "Send email", icon: "✉" },
      { href: "/admin/clients/setup", label: "Needs setup", icon: "⚠" },
    ],
  },
];

export const PROJECTS_ADMIN_NAV: ManagedNavGroup[] = [
  {
    title: "Projects",
    items: [
      {
        href: "/admin/projects",
        label: "All projects",
        icon: "◎",
        match: (p, q) => p === "/admin/projects" && !q,
      },
      {
        href: "/admin/projects?status=active",
        label: "Active campaigns",
        icon: "▶",
        match: (p, q) => p === "/admin/projects" && q === "status=active",
      },
      {
        href: "/admin/projects?status=preview",
        label: "Preview & draft",
        icon: "◌",
        match: (p, q) => p === "/admin/projects" && q === "status=preview",
      },
      {
        href: "/admin/projects?status=draft",
        label: "Draft",
        icon: "○",
        match: (p, q) => p === "/admin/projects" && q === "status=draft",
      },
      { href: "/admin/projects/responses", label: "Campaign responses", icon: "💬" },
    ],
  },
  {
    title: "InMail packages",
    items: [
      {
        href: "/admin/projects?package=1000",
        label: "1,000 InMails",
        icon: "1k",
        match: (p, q) => p === "/admin/projects" && q === "package=1000",
      },
      {
        href: "/admin/projects?package=5000",
        label: "5,000 InMails",
        icon: "5k",
        match: (p, q) => p === "/admin/projects" && q === "package=5000",
      },
      {
        href: "/admin/projects?package=10000",
        label: "10,000 InMails",
        icon: "10k",
        match: (p, q) => p === "/admin/projects" && q === "package=10000",
      },
      {
        href: "/admin/projects?package=20000",
        label: "20,000 InMails",
        icon: "20k",
        match: (p, q) => p === "/admin/projects" && q === "package=20000",
      },
    ],
  },
];
