import { redirect } from "next/navigation";

/** Leader live chat is the floating widget — no standalone route. */
export default function LeaderChatPage() {
  redirect("/team/leader");
}
