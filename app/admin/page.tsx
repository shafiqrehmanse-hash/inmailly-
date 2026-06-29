import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const authed = cookies().get("admin_authed")?.value === "1";
  if (!authed) redirect("/admin/login");

  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) {
    return (
      <div className="min-h-screen bg-ws-bg text-white p-8">
        ADMIN_SECRET_KEY is not set on the server.
      </div>
    );
  }

  return <AdminPanel adminKey={adminKey} />;
}
