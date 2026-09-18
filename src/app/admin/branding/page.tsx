import { requireAdmin } from "@/lib/admin";
import { getSiteLogo } from "@/lib/site-settings";
import BrandingForm from "./components/BrandingForm";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  await requireAdmin();
  const logo = await getSiteLogo();

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Branding</h1>
      <p className="text-sm text-muted-foreground mb-5">Upload a PNG logo to replace the default LB icon across the app.</p>
      <BrandingForm initialLogoUrl={logo.url} />
    </div>
  );
}
