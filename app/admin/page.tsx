import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";
import { verifyAdminKey } from "@/lib/supabase/admin";

export default function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  if (!verifyAdminKey(searchParams.key)) {
    redirect("/");
  }
  return <AdminPanel adminKey={searchParams.key!} />;
}
