import ClientShell from "@/components/client/ClientShell";

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
