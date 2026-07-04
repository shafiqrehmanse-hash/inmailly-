"use client";

import AdminHubShell from "@/components/admin/managed/AdminHubShell";
import AdminBlogSection from "@/components/admin/sections/AdminBlogSection";

export default function AdminBlogPage() {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminHubShell onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Blog</h1>
          <p className="text-sm text-lux-muted mt-1">Write and publish SEO articles for inmailly.com/blog.</p>
        </div>
        <AdminBlogSection />
      </div>
    </AdminHubShell>
  );
}
