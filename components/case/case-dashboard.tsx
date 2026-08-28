"use client";

import { useEffect, useState } from "react";
import type { AgentActivity, WebMCPStatus } from "../../types/case";
import { registerDenialDetailsTool } from "../../webmcp/denial-tools";
import { AsseraLogo } from "../brand/assera-logo";
import { CaseMain } from "./case-main";
import { RightRail } from "./right-rail";
import { CaseNavigation, Sidebar } from "./sidebar";

export function CaseDashboard() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [webMCPStatus, setWebMCPStatus] = useState<WebMCPStatus>("checking");

  useEffect(() => {
    let active = true;
    let unregister: (() => void) | undefined;

    void registerDenialDetailsTool({
      onAccess: (occurredAt) => {
        if (!active) return;
        setActivities((current) => [{
          id: `denial-read-${occurredAt}-${current.length}`,
          title: "Denial details accessed",
          category: "READ",
          impact: "No information changed",
          occurredAt,
        }, ...current]);
      },
      onStatusChange: (status) => {
        if (active) setWebMCPStatus(status);
      },
    }).then((registration) => {
      if (!active) {
        registration.unregister();
        return;
      }
      unregister = registration.unregister;
    });

    return () => {
      active = false;
      unregister?.();
    };
  }, []);

  const focusTreatmentDates = () => {
    const target = document.getElementById("treatment-dates");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  };

  return (
    <main className="case-shell">
      <Sidebar activityCount={activities.length} />
      <header className="case-topbar">
        <AsseraLogo className="case-mobile-logo" />
        <details className="case-mobile-menu">
          <summary>Case menu</summary>
          <CaseNavigation mobile activityCount={activities.length} />
        </details>
        <div className="workspace-context">
          <span className="lock-symbol" aria-hidden="true">⌑</span>
          <span>Private case workspace</span>
          <span className="synthetic-badge">Synthetic demo case</span>
        </div>
        <div className="patient-profile" aria-label="Maya Thompson, patient">
          <span className="patient-avatar" aria-hidden="true">MT</span>
          <span><strong>Maya Thompson</strong><small>Patient</small></span>
        </div>
      </header>
      <CaseMain onReviewDates={focusTreatmentDates} />
      <RightRail activities={activities} status={webMCPStatus} onReviewDates={focusTreatmentDates} />
    </main>
  );
}
