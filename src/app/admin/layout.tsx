import { requireAdmin } from "@/lib/admin";
import { getSiteLogo } from "@/lib/site-settings";
import { AdminShell } from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, logo] = await Promise.all([requireAdmin(), getSiteLogo()]);
  return (
    <AdminShell admin={admin} logoUrl={logo.url}>
      {children}
    </AdminShell>
  );
}