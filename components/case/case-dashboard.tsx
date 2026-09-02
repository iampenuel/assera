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
  const { toolAdapter, uiActions, snapshot } = useCaseWorkspace(caseId);
  const [webMCPStatus, setWebMCPStatus] =
    useState<WebMCPStatus>("checking");
  const [dateFormOpen, setDateFormOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let unregister: (() => void) | undefined;

    void registerCaseTools({
      adapter: toolAdapter,
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
  }, [toolAdapter]);

  const openTreatmentDates = () => {
    setDateFormOpen(true);
    focusWorkspaceElement("treatment-dates", "#treatment-start-date");
  };

  const closeTreatmentDates = () => {
    setDateFormOpen(false);
    focusWorkspaceElement("treatment-dates");
  };

  const confirmTreatmentDates = (input: ConfirmTreatmentDatesInput) => {
    const result = uiActions.confirmTreatmentDates(input);
    setDateFormOpen(false);
    focusWorkspaceElement("treatment-dates");
    return result;
  };

  const prepareAppeal = () => {
    const result = uiActions.prepareAppeal();
    focusWorkspaceElement("appeal-workspace");
    return result;
  };

  const reviewPackage = () => {
    focusWorkspaceElement("appeal-package-review", "#appeal-package-review-title");
  };

  const submitSimulation = () => {
    const result = uiActions.submitAppeal();
    setDateFormOpen(false);
    focusWorkspaceElement(
      "simulated-submission-receipt",
      "#submission-receipt-title",
    );
    return result;
  };

  const reviewReceipt = () => {
    focusWorkspaceElement(
      "simulated-submission-receipt",
      "#submission-receipt-title",
    );
  };

  return (
    <main className="case-shell">
      <Sidebar
        activityCount={snapshot.activities.length}
        evidenceCount={snapshot.effectiveEvidence.length}
        readiness={snapshot.readiness}
        hasDraft={snapshot.appealDraft !== null}
        hasSubmission={snapshot.appealSubmission !== null}
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
            hasSubmission={snapshot.appealSubmission !== null}
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
        onPrepare={prepareAppeal}
        onSaveDraft={(statement) =>
          uiActions.updateDraftStatement(statement)
        }
        onApprovePackage={uiActions.approveAppealPackage}
        onRevokeApproval={uiActions.revokeAppealApproval}
        onSubmitSimulation={submitSimulation}
      />
      <RightRail
        snapshot={snapshot}
        status={webMCPStatus}
        onReviewDates={openTreatmentDates}
        onPrepare={prepareAppeal}
        onReviewPackage={reviewPackage}
        onRevokeApproval={uiActions.revokeAppealApproval}
        onRunSimulation={submitSimulation}
        onReviewReceipt={reviewReceipt}
      />
    </main>
  );
}
