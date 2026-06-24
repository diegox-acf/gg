import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/admin/sidebar";

// Authoritative (server-side) admin gate for every dashboard page. Middleware also
// blocks at the edge, but this is the source of truth — it runs in the node runtime
// with the full session, so a non-admin (or signed-out) request never renders here.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || !session.user.roles.includes("admin")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session.user.email} />
      <main className="flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
