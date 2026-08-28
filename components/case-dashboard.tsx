"use client";

import { useEffect, useMemo, useState } from "react";
import { mayaCase } from "../data/case-fixture";
import type { AgentActivity, WebMCPStatus } from "../types/case";
import { registerDenialDetailsTool } from "../webmcp/denial-tools";

const statusCopy: Record<
  WebMCPStatus,
  { label: string; className: string; detail: string | null }
> = {
  checking: {
    label: "Connecting",
    className: "is-checking",
    detail: null,
  },
  available: {
    label: "Agent-ready",
    className: "is-available",
    detail: null,
  },
  unavailable: {
    label: "Preview mode",
    className: "is-unavailable",
    detail:
      "WebMCP isn’t available in this browser. The case workspace remains fully usable.",
  },
  error: {
    label: "Tool offline",
    className: "is-error",
    detail:
      "The agent connection couldn’t be established. No case information was affected.",
  },
};

function formatActivityTime(occurredAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(occurredAt));
}

export function CaseDashboard() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [webMCPStatus, setWebMCPStatus] =
    useState<WebMCPStatus>("checking");

  const readinessComplete = useMemo(
    () => mayaCase.readiness.filter((requirement) => requirement.complete).length,
    [],
  );

  useEffect(() => {
    let active = true;
    let unregister: (() => void) | undefined;

    void registerDenialDetailsTool({
      onAccess: (occurredAt) => {
        if (!active) return;

        setActivities((current) => [
          {
            id: `denial-read-${occurredAt}-${current.length}`,
            title: "Denial details accessed",
            category: "READ",
            impact: "No information changed",
            occurredAt,
          },
          ...current,
        ]);
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

  const toolStatus = statusCopy[webMCPStatus];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="ASSERA home">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>ASSERA</span>
        </a>
        <div className="topbar-context">
          <span className="secure-dot" aria-hidden="true" />
          Private case workspace
        </div>
        <div className="profile" aria-label="Maya Thompson, patient">
          <span aria-hidden="true">MT</span>
          <span className="profile-copy">
            <strong>Maya Thompson</strong>
            <small>Patient</small>
          </span>
        </div>
      </header>

      <div className="workspace" id="main-content">
        <section className="case-column" aria-labelledby="welcome-heading">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR CASE WORKSPACE</p>
              <h1 id="welcome-heading">Good afternoon, Maya.</h1>
              <p className="welcome-copy">
                Here’s where your prior authorization stands today.
              </p>
            </div>
            <span className="updated">Updated Aug 25, 2026</span>
          </div>

          <article className="case-card">
            <div className="case-heading">
              <div>
                <div className="status-line">
                  <span className="denied-badge">DENIED</span>
                  <span className="case-number">Case {mayaCase.case_id}</span>
                </div>
                <h2>{mayaCase.service}</h2>
                <p className="payer">{mayaCase.payer}</p>
              </div>
              <div className="deadline-box">
                <span>APPEAL DEADLINE</span>
                <strong>October 29, 2026</strong>
                <small>Review before this date</small>
              </div>
            </div>

            <div className="case-divider" />

            <section className="denial-section" aria-labelledby="denial-heading">
              <p className="section-kicker">DENIAL EXPLANATION</p>
              <h3 id="denial-heading">Why was this denied?</h3>
              <div className="explanation-grid">
                <div className="insurer-language">
                  <span className="source-label">
                    ORIGINAL INSURER LANGUAGE
                  </span>
                  <blockquote>“{mayaCase.reason}”</blockquote>
                  <p>Reason code: {mayaCase.reason_code}</p>
                </div>
                <div className="plain-language">
                  <span className="translation-label">
                    PLAIN-LANGUAGE EXPLANATION
                  </span>
                  <p>{mayaCase.plain_language_explanation}</p>
                  <small>ASSERA explanation · Not insurer source text</small>
                </div>
              </div>
            </section>
          </article>

          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-icon" aria-hidden="true">
                04
              </div>
              <div>
                <p className="summary-label">EVIDENCE</p>
                <h3>{mayaCase.evidence.length} documents</h3>
                <p>Records currently attached to this case</p>
              </div>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </article>
            <article className="summary-card readiness-card">
              <div
                className="ring"
                aria-label={`${readinessComplete} of ${mayaCase.readiness.length} administrative requirements complete`}
              >
                <span>
                  {readinessComplete}/{mayaCase.readiness.length}
                </span>
              </div>
              <div>
                <p className="summary-label">APPEAL READINESS</p>
                <h3>
                  {readinessComplete} of {mayaCase.readiness.length} complete
                </h3>
                <p>
                  <span className="warning-dot" aria-hidden="true" /> Treatment
                  dates need confirmation
                </p>
              </div>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </article>
          </div>
        </section>

        <aside
          className="activity-panel"
          aria-labelledby="activity-heading"
          aria-live="polite"
        >
          <div className="activity-heading-row">
            <div>
              <p className="section-kicker">TRANSPARENCY</p>
              <h2 id="activity-heading">Agent activity</h2>
            </div>
            <span className={`tool-status ${toolStatus.className}`}>
              <i aria-hidden="true" /> {toolStatus.label}
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="empty-activity">
              <div className="empty-symbol" aria-hidden="true">
                <span />
              </div>
              <h3>No agent activity yet</h3>
              <p>
                When your agent accesses case information, you’ll see a clear
                record here.
              </p>
              {toolStatus.detail ? (
                <p className="connection-note">{toolStatus.detail}</p>
              ) : null}
            </div>
          ) : (
            <ol className="activity-list">
              {activities.map((activity) => (
                <li className="activity-item" key={activity.id}>
                  <div className="activity-icon" aria-hidden="true">
                    ↗
                  </div>
                  <div className="activity-copy">
                    <div className="activity-title-row">
                      <h3>{activity.title}</h3>
                      <time dateTime={activity.occurredAt}>
                        {formatActivityTime(activity.occurredAt)}
                      </time>
                    </div>
                    <span className="read-badge">{activity.category}</span>
                    <p>{activity.impact}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="activity-promise">
            <span className="promise-mark" aria-hidden="true">
              ✓
            </span>
            <p>
              <strong>You stay in control.</strong>
              <br />
              Actions that change or submit information always require your
              approval.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
