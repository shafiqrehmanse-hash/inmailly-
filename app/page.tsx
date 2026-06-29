import HomePage from "@/components/home/HomePage";
import { getSiteContent } from "@/lib/site-content-server";

export default async function Page() {
  const content = await getSiteContent();
  return <HomePage content={content} />;
}
