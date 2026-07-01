import { redirect } from "next/navigation";

/** Live chat is the floating widget on all team pages — no standalone route. */
export default function TeamChatPage() {
  redirect("/team/hub");
}
