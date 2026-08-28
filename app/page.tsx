import type { Metadata } from "next";
import { CaseDashboard } from "../components/case-dashboard";

export const metadata: Metadata = {
  title: "Case NS-PA-48291",
  description: "Understand your denial and prepare a clear next step.",
};

export default function Home() {
  return <CaseDashboard />;
}
