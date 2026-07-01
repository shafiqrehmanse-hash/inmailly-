import { redirect } from "next/navigation";

export default function TeamWelcomeEmailRedirect() {
  redirect("/admin/team/email");
}
