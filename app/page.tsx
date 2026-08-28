import type { Metadata } from "next";
import { EditorialSections } from "../components/landing/editorial-sections";
import { Hero } from "../components/landing/hero";

export const metadata: Metadata = {
  title: { absolute: "ASSERA — A denial isn’t the final word." },
  description:
    "Understand a prior-authorization denial, see what is missing, and prepare the next step while staying in control.",
};

export default function Home() {
  return (
    <main className="landing-page">
      <Hero />
      <EditorialSections />
    </main>
  );
}
