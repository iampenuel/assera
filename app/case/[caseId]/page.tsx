import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseDashboard } from "../../../components/case/case-dashboard";
import { SUPPORTED_CASE_ID } from "../../../data/case-fixture";

const title = "Case NS-PA-48291";
const description = "Maya Thompson’s synthetic MRI prior-authorization denial workspace.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [] },
  twitter: { title, description, images: [] },
};

interface CasePageProps {
  readonly params: Promise<{ caseId: string }>;
}

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;

  if (caseId !== SUPPORTED_CASE_ID) {
    notFound();
  }

  return <CaseDashboard caseId={caseId} />;
}
