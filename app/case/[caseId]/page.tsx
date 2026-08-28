import type { Metadata } from "next";
import { CaseDashboard } from "../../../components/case/case-dashboard";

const title = "Case NS-PA-48291";
const description = "Maya Thompson’s synthetic MRI prior-authorization denial workspace.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [] },
  twitter: { title, description, images: [] },
};

export default function CasePage() {
  return <CaseDashboard />;
}
