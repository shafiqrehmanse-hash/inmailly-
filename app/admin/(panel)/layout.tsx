import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminKeyProvider, AdminToastProvider } from "@/lib/admin-context";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const authed = cookies().get("admin_authed")?.value === "1";
  if (!authed) redirect("/admin/login");

  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) {
    return (
      <div className="min-h-screen bg-lux-bg text-lux-text p-8">
        ADMIN_SECRET_KEY is not set on the server.
      </div>
    );
  }

  return (
    <AdminKeyProvider adminKey={adminKey}>
      <AdminToastProvider>{children}</AdminToastProvider>
    </AdminKeyProvider>
  );
}
