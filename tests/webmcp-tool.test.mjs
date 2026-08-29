import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const esbuild = fileURLToPath(new URL("../node_modules/.bin/esbuild", import.meta.url));
const entry = fileURLToPath(new URL("../webmcp/register-case-tools.ts", import.meta.url));
const compiledTools = execFileSync(
  esbuild,
  [entry, "--bundle", "--platform=node", "--format=esm"],
  { encoding: "utf8" },
);
const moduleUrl =
  "data:text/javascript;base64," + Buffer.from(compiledTools).toString("base64");
const caseTools = await import(moduleUrl);

const validInput = { case_id: "NS-PA-48291" };
const validDates = {
  start_date: "2026-07-01",
  end_date: "2026-08-19",
  confirmation: true,
};
const expectedDetails = {
  case_id: "NS-PA-48291",
  service: "MRI — Right Knee",
  decision: "denied",
  decision_date: "2026-08-25",
  reason_code: "DOC-214",
  reason:
    "Documentation did not establish six weeks of physician-directed conservative treatment.",
  appeal_deadline: "2026-10-29",
  payer: "Northstar Health",
};

function createTestWorkspace() {
  let state = caseTools.createInitialCaseWorkspaceState(validInput.case_id);
  let tick = 0;
  const adapter = caseTools.createCaseWorkspaceAdapter({
    getState: () => state,
    applyAction: (action) => {
      state = caseTools.caseWorkspaceReducer(state, action);
      return state;
    },
    now: () => `2026-08-29T12:${String(tick++).padStart(2, "0")}:00.000Z`,
  });
  return { adapter, getState: () => state };
}

function assertCaseToolError(action, code, message) {
  assert.throws(action, (error) => {
    assert.equal(error.name, "CaseToolError");
    assert.equal(error.code, code);
    assert.equal(error.message, message);
    return true;
  });
}

function assertDateError(input, code, message) {
  assert.throws(
    () => caseTools.validateTreatmentDates(input, "2026-08-20"),
    (error) => {
      assert.equal(error.name, "TreatmentDateValidationError");
      assert.equal(error.code, code);
      assert.equal(error.message, message);
      return true;
    },
  );
}

test("Milestone 01 and 02 READ handlers preserve their contracts", () => {
  assert.deepEqual(caseTools.getDenialDetails(validInput), expectedDetails);

  const coverage = caseTools.getCoverageRequirements(validInput);
  assert.equal(coverage.policy_id, "NS-MSK-MRI-KNEE-2026");
  assert.equal(coverage.synthetic, true);
  assert.deepEqual(
    coverage.requirements.map(({ id }) => id),
    [
      "physician_evaluation",
      "prior_xray",
      "conservative_treatment_duration",
      "persistent_symptoms",
      "treatment_date_range",
    ],
  );

  const evidence = caseTools.listAppealEvidence(validInput);
  assert.equal(evidence.count, 4);
  assert.deepEqual(
    evidence.documents.map(({ id, status }) => ({ id, status })),
    [
      { id: "evidence-orthopedic-evaluation", status: "verified" },
      { id: "evidence-physical-therapy", status: "needs_confirmation" },
      { id: "evidence-knee-xray", status: "verified" },
      { id: "evidence-denial-notice", status: "insurer_source" },
    ],
  );

  const readiness = caseTools.checkAppealReadiness(validInput);
  assert.deepEqual(readiness.summary, {
    total: 5,
    complete: 4,
    incomplete: 1,
    unavailable: 0,
  });
  assert.equal(readiness.ready_to_prepare, false);
  assert.deepEqual(readiness.next_required_information, [
    {
      field: "treatment_date_range",
      description: "Confirm the physical-therapy start and end dates.",
    },
  ]);

  for (const handler of [
    caseTools.getDenialDetails,
    caseTools.getCoverageRequirements,
    caseTools.listAppealEvidence,
    caseTools.checkAppealReadiness,
  ]) {
    assertCaseToolError(
      () => handler({ case_id: "UNKNOWN" }),
      "CASE_NOT_FOUND",
      "No ASSERA case was found for case_id “UNKNOWN”.",
    );
  }
});

test("date validation accepts the demo range and rejects every unsafe boundary", () => {
  assert.deepEqual(
    caseTools.validateTreatmentDates(validDates, "2026-08-20"),
    { start_date: "2026-07-01", end_date: "2026-08-19", duration_days: 49 },
  );
  assertDateError(
    { ...validDates, start_date: "" },
    "INVALID_DATE",
    "Enter valid treatment start and end dates.",
  );
  assertDateError(
    { ...validDates, end_date: "2026-02-30" },
    "INVALID_DATE",
    "Enter valid treatment start and end dates.",
  );
  assertDateError(
    { ...validDates, start_date: "2026-08-19", end_date: "2026-07-01" },
    "DATE_ORDER_INVALID",
    "The treatment start date must be on or before the end date.",
  );
  assertDateError(
    { ...validDates, end_date: "2026-08-21" },
    "DATE_AFTER_RECORD",
    "The treatment end date cannot be later than the physical-therapy summary dated August 20, 2026.",
  );
  assertDateError(
    { ...validDates, start_date: "2026-07-10" },
    "TREATMENT_RANGE_TOO_SHORT",
    "This date range does not establish six weeks of treatment. Review the dates before confirming.",
  );
  assertDateError(
    { ...validDates, confirmation: false },
    "CONFIRMATION_REQUIRED",
    "Confirm that the dates are accurate before updating the case workspace.",
  );
});

test("human confirmation derives effective evidence and live 5/5 readiness without mutating fixtures", () => {
  const { adapter } = createTestWorkspace();
  const before = adapter.getSnapshot();
  const fixtureBefore = JSON.stringify(before.baseEvidence);
  const ptBefore = before.effectiveEvidence.find(
    ({ id }) => id === "evidence-physical-therapy",
  );
  assert.equal(ptBefore.supports.includes("treatment_date_range"), false);
  assert.equal(ptBefore.needs_confirmation.length, 1);

  const result = adapter.confirmTreatmentDates(validDates, "HUMAN");
  const after = adapter.getSnapshot();
  const ptAfter = after.effectiveEvidence.find(
    ({ id }) => id === "evidence-physical-therapy",
  );

  assert.equal(result.action, "confirmed");
  assert.equal(result.confirmation.duration_days, 49);
  assert.deepEqual(result.confirmation.confirmed_by, {
    type: "patient",
    name: "Maya Thompson",
  });
  assert.equal(result.confirmation.provided_via, "ASSERA_UI");
  assert.equal(result.confirmation.source_evidence_id, "evidence-physical-therapy");
  assert.equal(ptAfter.status, "human_confirmed");
  assert.equal(ptAfter.supports.includes("treatment_date_range"), true);
  assert.equal(ptAfter.needs_confirmation.length, 0);
  assert.equal(ptAfter.human_confirmation, result.confirmation);
  assert.deepEqual(after.readiness.summary, {
    total: 5,
    complete: 5,
    incomplete: 0,
    unavailable: 0,
  });
  assert.equal(after.readiness.ready_to_prepare, true);
  assert.equal(after.appealDraft, null);
  assert.equal(JSON.stringify(after.baseEvidence), fixtureBefore);
  assert.equal(JSON.stringify(before.baseEvidence), fixtureBefore);
  assert.deepEqual(after.activities[0], {
    id: "human-2026-08-29T12:00:00.000Z-0",
    title: "Treatment dates confirmed",
    category: "PREPARE",
    actor: "HUMAN",
    outcome: "completed",
    impact: "Case workspace updated; nothing submitted",
    occurredAt: "2026-08-29T12:00:00.000Z",
  });
});

test("prepare is typed-blocked at 4/5 and records honest AGENT safety activity", () => {
  const { adapter } = createTestWorkspace();
  assert.throws(
    () => caseTools.prepareAppeal(validInput, adapter),
    (error) => {
      assert.equal(error.name, "PrepareBlockedError");
      assert.equal(error.code, "PREPARE_BLOCKED");
      assert.deepEqual(error.incomplete_requirement_ids, ["treatment_date_range"]);
      assert.deepEqual(error.unavailable_requirement_ids, []);
      assert.deepEqual(error.next_required_information, [
        {
          field: "treatment_date_range",
          description: "Confirm the physical-therapy start and end dates.",
        },
      ]);
      return true;
    },
  );

  const snapshot = adapter.getSnapshot();
  assert.equal(snapshot.appealDraft, null);
  assert.equal(snapshot.treatmentDateConfirmation, null);
  assert.equal(snapshot.readiness.summary.complete, 4);
  assert.deepEqual(snapshot.activities[0], {
    id: "prepare_appeal-2026-08-29T12:00:00.000Z-0",
    title: "Appeal preparation blocked",
    category: "PREPARE",
    actor: "AGENT",
    outcome: "blocked",
    impact: "Treatment dates require confirmation; no draft created or submitted",
    toolName: "prepare_appeal",
    occurredAt: "2026-08-29T12:00:00.000Z",
  });
});

test("preparation creates one deterministic, known-facts-only, unsubmitted draft", () => {
  const { adapter } = createTestWorkspace();
  adapter.confirmTreatmentDates(validDates, "HUMAN");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail("Preparing a local draft must not use the network");
  try {
    const result = caseTools.prepareAppeal(validInput, adapter);
    const snapshot = adapter.getSnapshot();

    assert.equal(result.action, "created");
    assert.equal(result.draft, snapshot.appealDraft);
    assert.equal(result.draft.id, "appeal-draft-NS-PA-48291-20260701-20260819");
    assert.equal(result.draft.status, "draft");
    assert.equal(result.draft.submission_status, "not_submitted");
    assert.equal(result.draft.synthetic, true);
    assert.deepEqual(result.draft.unresolved_items, []);
    assert.deepEqual(result.draft.requirement_summary, {
      total: 5,
      complete: 5,
      incomplete: 0,
      unavailable: 0,
    });
    assert.deepEqual(result.draft.evidence_ids, [
      "evidence-orthopedic-evaluation",
      "evidence-physical-therapy",
      "evidence-knee-xray",
      "evidence-denial-notice",
    ]);
    assert.deepEqual(result.draft.treatment_date_confirmation, snapshot.treatmentDateConfirmation);
    assert.match(result.draft.statement, /July 1, 2026 through August 19, 2026/);
    assert.match(result.draft.statement, /49 calendar days \(7 weeks\)/);
    assert.match(result.draft.statement, /synthetic demonstration data/);
    assert.match(result.draft.statement, /has not been submitted/);
    assert.doesNotMatch(result.draft.statement, /will succeed|definitely succeed|medically necessary|illegal denial/i);
    assert.equal(snapshot.activities.at(-1).actor, "AGENT");
    assert.equal(snapshot.activities.at(-1).outcome, "completed");
    assert.equal(snapshot.activities.at(-1).impact, "Draft created in ASSERA; nothing submitted");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repeated preparation reuses the exact stored draft and same date confirmation preserves it", () => {
  const { adapter } = createTestWorkspace();
  adapter.confirmTreatmentDates(validDates, "HUMAN");
  const created = adapter.prepareAppeal("HUMAN");
  const storedDraft = adapter.getSnapshot().appealDraft;
  const reused = adapter.prepareAppeal("HUMAN");

  assert.equal(created.action, "created");
  assert.equal(reused.action, "reused");
  assert.equal(reused.draft, storedDraft);
  assert.equal(reused.draft.id, created.draft.id);
  assert.equal(adapter.getSnapshot().appealDraft, storedDraft);
  assert.equal(adapter.getSnapshot().activities.at(-1).title, "Existing appeal draft opened");

  const activityCount = adapter.getSnapshot().activities.length;
  const unchanged = adapter.confirmTreatmentDates(validDates, "HUMAN");
  assert.equal(unchanged.action, "unchanged");
  assert.equal(unchanged.draft_invalidated, false);
  assert.equal(adapter.getSnapshot().appealDraft, storedDraft);
  assert.equal(adapter.getSnapshot().activities.length, activityCount);
});

test("changed dates invalidate a stale draft and an explicit save preserves draft provenance", () => {
  const { adapter } = createTestWorkspace();
  adapter.confirmTreatmentDates(validDates, "HUMAN");
  const created = adapter.prepareAppeal("HUMAN");
  const saved = adapter.updateDraftStatement("  Patient-reviewed local statement.  ", "HUMAN");

  assert.equal(saved.id, created.draft.id);
  assert.equal(saved.statement, "Patient-reviewed local statement.");
  assert.deepEqual(saved.evidence_ids, created.draft.evidence_ids);
  assert.deepEqual(saved.provenance, created.draft.provenance);
  assert.equal(adapter.getSnapshot().activities.at(-1).title, "Appeal draft updated");
  assert.equal(adapter.getSnapshot().activities.at(-1).actor, "HUMAN");

  const changed = adapter.confirmTreatmentDates(
    { start_date: "2026-07-02", end_date: "2026-08-20", confirmation: true },
    "HUMAN",
  );
  assert.equal(changed.action, "updated");
  assert.equal(changed.draft_invalidated, true);
  assert.equal(adapter.getSnapshot().appealDraft, null);
  assert.equal(adapter.getSnapshot().readiness.ready_to_prepare, true);
  assert.equal(adapter.getSnapshot().activities.at(-1).title, "Treatment dates updated");
  assert.equal(
    adapter.getSnapshot().activities.at(-1).impact,
    "Case workspace updated; the previous draft must be prepared again. Nothing submitted.",
  );
});

test("draft statement validation rejects blank and excessive edits", () => {
  const { adapter } = createTestWorkspace();
  adapter.confirmTreatmentDates(validDates, "HUMAN");
  adapter.prepareAppeal("HUMAN");
  assert.throws(
    () => adapter.updateDraftStatement("   ", "HUMAN"),
    (error) => error.code === "DRAFT_STATEMENT_REQUIRED",
  );
  assert.throws(
    () => adapter.updateDraftStatement("x".repeat(5_001), "HUMAN"),
    (error) => error.code === "DRAFT_STATEMENT_TOO_LONG",
  );
});

test("registers exactly five unique tools through one signal and exposes live workspace state", async () => {
  const registeredTools = [];
  const registrationOptions = [];
  const statuses = [];
  const activities = [];
  const { adapter } = createTestWorkspace();

  globalThis.document = {
    modelContext: {
      async registerTool(tool, options) {
        assert.equal(
          registeredTools.some(({ name }) => name === tool.name),
          false,
          `Duplicate registration for ${tool.name}`,
        );
        registeredTools.push(tool);
        registrationOptions.push(options);
      },
    },
  };

  const registration = await caseTools.registerCaseTools({
    adapter,
    onActivity: (activity) => activities.push(activity),
    onStatusChange: (status) => statuses.push(status),
  });

  assert.deepEqual(registeredTools.map(({ name }) => name), [
    "get_denial_details",
    "get_coverage_requirements",
    "list_appeal_evidence",
    "check_appeal_readiness",
    "prepare_appeal",
  ]);
  assert.equal(registeredTools.length, 5);
  assert.equal(registeredTools.filter(({ annotations }) => annotations.readOnlyHint).length, 4);
  assert.equal(registeredTools.at(-1).annotations.readOnlyHint, false);
  assert.equal(registeredTools.at(-1).annotations.untrustedContentHint, false);
  assert.equal(registeredTools.some(({ name }) => /submit|act/i.test(name)), false);
  for (const tool of registeredTools) {
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.deepEqual(tool.inputSchema.required, ["case_id"]);
    assert.equal(tool.inputSchema.properties.case_id.const, validInput.case_id);
  }
  assert.deepEqual(statuses, ["available"]);
  assert.equal(new Set(registrationOptions.map(({ signal }) => signal)).size, 1);

  const readinessTool = registeredTools.find(({ name }) => name === "check_appeal_readiness");
  const evidenceTool = registeredTools.find(({ name }) => name === "list_appeal_evidence");
  const prepareTool = registeredTools.find(({ name }) => name === "prepare_appeal");
  assert.equal(readinessTool.execute(validInput).summary.complete, 4);
  assert.throws(() => prepareTool.execute(validInput), (error) => error.code === "PREPARE_BLOCKED");
  assert.equal(activities.at(-1).outcome, "blocked");

  adapter.confirmTreatmentDates(validDates, "HUMAN");
  assert.equal(readinessTool.execute(validInput).summary.complete, 5);
  const effectivePt = evidenceTool
    .execute(validInput)
    .documents.find(({ id }) => id === "evidence-physical-therapy");
  assert.equal(effectivePt.status, "human_confirmed");
  assert.equal(effectivePt.supports.includes("treatment_date_range"), true);
  const prepared = prepareTool.execute(validInput);
  assert.equal(prepared.action, "created");
  assert.equal(adapter.getSnapshot().appealDraft.id, prepared.draft.id);

  const readEvents = activities.filter(({ category }) => category === "READ");
  assert.equal(readEvents.length, 3);
  assert.equal(readEvents.every(({ actor }) => actor === "AGENT"), true);
  assert.equal(readEvents.every(({ outcome }) => outcome === "completed"), true);
  assert.equal(readEvents.every(({ impact }) => impact === "No information changed"), true);
  assert.equal(
    adapter.getSnapshot().activities
      .filter(({ category }) => category === "PREPARE")
      .every(({ impact }) => impact !== "No information changed"),
    true,
  );

  registration.unregister();
  assert.equal(registrationOptions.every(({ signal }) => signal.aborted), true);
  delete globalThis.document;
});

test("malformed and unknown tool input create no activity", async () => {
  const registeredTools = [];
  const { adapter } = createTestWorkspace();
  globalThis.document = {
    modelContext: {
      async registerTool(tool) {
        registeredTools.push(tool);
      },
    },
  };
  const registration = await caseTools.registerCaseTools({
    adapter,
    onStatusChange: () => undefined,
  });
  assert.throws(() => registeredTools[0].execute({}), /A valid case_id is required/);
  assert.throws(() => registeredTools.at(-1).execute({ case_id: "UNKNOWN" }), /No ASSERA case/);
  assert.deepEqual(adapter.getSnapshot().activities, []);
  registration.unregister();
  delete globalThis.document;
});

test("the no-WebMCP fallback preserves human confirmation and manual preparation", async () => {
  delete globalThis.document;
  const statuses = [];
  const { adapter } = createTestWorkspace();
  const registration = await caseTools.registerCaseTools({
    adapter,
    onStatusChange: (status) => statuses.push(status),
  });
  assert.deepEqual(statuses, ["unavailable"]);
  assert.doesNotThrow(() => registration.unregister());

  adapter.confirmTreatmentDates(validDates, "HUMAN");
  const prepared = adapter.prepareAppeal("HUMAN");
  assert.equal(prepared.action, "created");
  assert.equal(adapter.getSnapshot().activities.at(-1).actor, "HUMAN");
  assert.equal(adapter.getSnapshot().appealDraft.submission_status, "not_submitted");
});

test("read and prepare eval files enforce safe capability boundaries", async () => {
  const readEval = JSON.parse(
    await readFile(new URL("../evals/read-layer.json", import.meta.url), "utf8"),
  );
  const prepareEval = JSON.parse(
    await readFile(new URL("../evals/prepare-layer.json", import.meta.url), "utf8"),
  );

  assert.equal(readEval.milestone, "02-read-layer");
  assert.equal(prepareEval.milestone, "03-prepare-layer");
  assert.equal(prepareEval.case_id, validInput.case_id);
  assert.equal(prepareEval.synthetic, true);
  assert.equal(prepareEval.scenarios.length, 7);
  assert.equal(prepareEval.scenarios[0].expected_error, "PREPARE_BLOCKED");
  assert.deepEqual(prepareEval.scenarios[2].expected_tools, [
    "check_appeal_readiness",
    "prepare_appeal",
  ]);
  assert.equal(prepareEval.scenarios[3].expected_result.action, "reused");
  assert.equal(prepareEval.scenarios[4].expected_result.prior_draft_invalidated, true);
  assert.equal(prepareEval.scenarios[5].expected_behavior.success_prediction, false);
  assert.equal(prepareEval.scenarios[6].expected_behavior.submit_tool, false);
  assert.equal(prepareEval.scenarios[6].external_submission, false);
  assert.equal(JSON.stringify(prepareEval).includes("submit_appeal"), false);
});

test("source integration exposes accessible local UI and no consequential control", async () => {
  const [dashboard, form, workspace, registrar] = await Promise.all([
    readFile(new URL("../components/case/case-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/case/treatment-date-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/case/appeal-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../webmcp/register-case-tools.ts", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /useCaseWorkspace\(caseId\)/);
  assert.match(dashboard, /registerCaseTools\(\{\s*adapter,/s);
  assert.match(form, /type="date"/);
  assert.match(form, /<fieldset>/);
  assert.match(form, /aria-describedby/);
  assert.match(form, /I confirm these dates are accurate to the best of my knowledge\./);
  assert.match(workspace, /Save changes/);
  assert.match(workspace, /Nothing has been sent to Northstar Health\./);
  assert.doesNotMatch(workspace, /type="submit"|>Submit</i);
  assert.doesNotMatch(`${dashboard}${form}${workspace}${registrar}`, /requestUserInteraction|submit_appeal|fetch\(/);
});
