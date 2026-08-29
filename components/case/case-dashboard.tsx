"use client";

import { useEffect, useState } from "react";
import { useCaseWorkspace } from "../../hooks/use-case-workspace";
import type {
  ConfirmTreatmentDatesInput,
  WebMCPStatus,
} from "../../types/case";
import { registerCaseTools } from "../../webmcp/register-case-tools";
import { AsseraLogo } from "../brand/assera-logo";
import { CaseMain } from "./case-main";
import { RightRail } from "./right-rail";
import { CaseNavigation, Sidebar } from "./sidebar";

function focusWorkspaceElement(id: string, selector?: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const container = document.getElementById(id);
      const target = selector
        ? container?.querySelector<HTMLElement>(selector)
        : container;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      container?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      target?.focus({ preventScroll: true });
    });
  });
}

export function CaseDashboard({ caseId }: { readonly caseId: string }) {
  const { adapter, snapshot } = useCaseWorkspace(caseId);
  const [webMCPStatus, setWebMCPStatus] =
    useState<WebMCPStatus>("checking");
  const [dateFormOpen, setDateFormOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let unregister: (() => void) | undefined;

    void registerCaseTools({
      adapter,
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
  }, [adapter]);

  const openTreatmentDates = () => {
    setDateFormOpen(true);
    focusWorkspaceElement("treatment-dates", "#treatment-start-date");
  };

  const closeTreatmentDates = () => {
    setDateFormOpen(false);
    focusWorkspaceElement("treatment-dates");
  };

  const confirmTreatmentDates = (input: ConfirmTreatmentDatesInput) => {
    const result = adapter.confirmTreatmentDates(input, "HUMAN");
    setDateFormOpen(false);
    focusWorkspaceElement("treatment-dates");
    return result;
  };

  const prepareAppeal = () => {
    const result = adapter.prepareAppeal("HUMAN");
    focusWorkspaceElement("appeal-workspace");
    return result;
  };

  const reviewDraft = () => {
    focusWorkspaceElement("appeal-workspace", "#appeal-draft-statement");
  };

  return (
    <main className="case-shell">
      <Sidebar
        activityCount={snapshot.activities.length}
        evidenceCount={snapshot.effectiveEvidence.length}
        readiness={snapshot.readiness}
        hasDraft={snapshot.appealDraft !== null}
      />
      <header className="case-topbar">
        <AsseraLogo className="case-mobile-logo" />
        <details className="case-mobile-menu">
          <summary>Case menu</summary>
          <CaseNavigation
            mobile
            activityCount={snapshot.activities.length}
            evidenceCount={snapshot.effectiveEvidence.length}
            readiness={snapshot.readiness}
            hasDraft={snapshot.appealDraft !== null}
          />
        </details>
        <div className="workspace-context">
          <span className="lock-symbol" aria-hidden="true">⌑</span>
          <span>Private case workspace</span>
          <span className="synthetic-badge">Synthetic demo case</span>
        </div>
        <div className="patient-profile" aria-label={`${snapshot.caseData.patient.name}, patient`}>
          <span className="patient-avatar" aria-hidden="true">MT</span>
          <span><strong>{snapshot.caseData.patient.name}</strong><small>Patient</small></span>
        </div>
      </header>
      <CaseMain
        snapshot={snapshot}
        dateFormOpen={dateFormOpen}
        onReviewDates={openTreatmentDates}
        onCancelDates={closeTreatmentDates}
        onConfirmDates={confirmTreatmentDates}
        onSaveDraft={(statement) =>
          adapter.updateDraftStatement(statement, "HUMAN")
        }
      />
      <RightRail
        snapshot={snapshot}
        status={webMCPStatus}
        onReviewDates={openTreatmentDates}
        onPrepare={prepareAppeal}
        onReviewDraft={reviewDraft}
      />
    </main>
  );
}
