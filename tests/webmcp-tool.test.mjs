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

function assertCaseToolError(action, code, message) {
  assert.throws(action, (error) => {
    assert.equal(error.name, "CaseToolError");
    assert.equal(error.code, code);
    assert.equal(error.message, message);
    return true;
  });
}

test("get_denial_details preserves the Milestone 01 denial record", () => {
  assert.deepEqual(caseTools.getDenialDetails(validInput), expectedDetails);
  assertCaseToolError(
    () => caseTools.getDenialDetails({ ...validInput, unexpected: true }),
    "INVALID_INPUT",
    "A valid case_id is required.",
  );
  assertCaseToolError(
    () => caseTools.getDenialDetails({ case_id: "UNKNOWN" }),
    "CASE_NOT_FOUND",
    "No ASSERA case was found for case_id “UNKNOWN”.",
  );
});

test("get_coverage_requirements returns the five fictional policy criteria", () => {
  const result = caseTools.getCoverageRequirements(validInput);

  assert.equal(result.case_id, validInput.case_id);
  assert.equal(result.payer, "Northstar Health");
  assert.equal(result.policy_id, "NS-MSK-MRI-KNEE-2026");
  assert.equal(
    result.policy_title,
    "Advanced Imaging — Knee MRI Documentation Requirements",
  );
  assert.equal(result.effective_date, "2026-01-01");
  assert.equal(result.synthetic, true);
  assert.deepEqual(
    result.requirements.map(({ id }) => id),
    [
      "physician_evaluation",
      "prior_xray",
      "conservative_treatment_duration",
      "persistent_symptoms",
      "treatment_date_range",
    ],
  );
  assertCaseToolError(
    () => caseTools.getCoverageRequirements({ case_id: "UNKNOWN" }),
    "CASE_NOT_FOUND",
    "No ASSERA case was found for case_id “UNKNOWN”.",
  );
});

test("list_appeal_evidence returns four structured workspace documents", () => {
  const result = caseTools.listAppealEvidence(validInput);

  assert.equal(result.case_id, validInput.case_id);
  assert.equal(result.synthetic, true);
  assert.equal(result.count, 4);
  assert.deepEqual(
    result.documents.map(({ id, source, document_date, status }) => ({
      id,
      source,
      document_date,
      status,
    })),
    [
      {
        id: "evidence-orthopedic-evaluation",
        source: "Penn Orthopedics",
        document_date: "2026-08-06",
        status: "verified",
      },
      {
        id: "evidence-physical-therapy",
        source: "Keystone PT",
        document_date: "2026-08-20",
        status: "needs_confirmation",
      },
      {
        id: "evidence-knee-xray",
        source: "Northstar Imaging",
        document_date: "2026-07-29",
        status: "verified",
      },
      {
        id: "evidence-denial-notice",
        source: "Northstar Health",
        document_date: "2026-08-25",
        status: "insurer_source",
      },
    ],
  );
  assert.deepEqual(result.documents[0].supports, [
    "physician_evaluation",
    "persistent_symptoms",
  ]);
  assert.deepEqual(result.documents[1].supports, [
    "conservative_treatment_duration",
  ]);
  assert.deepEqual(result.documents[2].supports, ["prior_xray"]);
  assert.deepEqual(result.documents[3].supports, []);
  assertCaseToolError(
    () => caseTools.listAppealEvidence({ case_id: "UNKNOWN" }),
    "CASE_NOT_FOUND",
    "No ASSERA case was found for case_id “UNKNOWN”.",
  );
});

test("check_appeal_readiness derives the one incomplete administrative item", () => {
  const result = caseTools.checkAppealReadiness(validInput);

  assert.deepEqual(result.summary, {
    total: 5,
    complete: 4,
    incomplete: 1,
    unavailable: 0,
  });
  assert.equal(result.synthetic, true);
  assert.equal(result.ready_to_prepare, false);

  const treatmentDates = result.requirements.find(
    ({ requirement_id }) => requirement_id === "treatment_date_range",
  );
  assert.deepEqual(treatmentDates, {
    requirement_id: "treatment_date_range",
    status: "incomplete",
    supported_by: ["evidence-physical-therapy"],
    issue: "Exact physical-therapy start and end dates require confirmation.",
  });
  assert.deepEqual(result.next_required_information, [
    {
      field: "treatment_date_range",
      description: "Confirm the physical-therapy start and end dates.",
    },
  ]);
  assert.deepEqual(caseTools.checkAppealReadiness(validInput), result);
  assertCaseToolError(
    () => caseTools.checkAppealReadiness({ case_id: "UNKNOWN" }),
    "CASE_NOT_FOUND",
    "No ASSERA case was found for case_id “UNKNOWN”.",
  );
});

test("registers exactly four unique read-only tools through one lifecycle", async () => {
  const registeredTools = [];
  const registrationOptions = [];
  const statuses = [];
  const activities = [];

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
    onActivity: (activity) => activities.push(activity),
    onStatusChange: (status) => statuses.push(status),
  });

  assert.deepEqual(
    registeredTools.map(({ name }) => name),
    [
      "get_denial_details",
      "get_coverage_requirements",
      "list_appeal_evidence",
      "check_appeal_readiness",
    ],
  );
  assert.equal(registeredTools.length, 4);
  for (const tool of registeredTools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.untrustedContentHint, false);
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.deepEqual(tool.inputSchema.required, ["case_id"]);
    assert.equal(tool.inputSchema.properties.case_id.const, validInput.case_id);
  }
  assert.deepEqual(statuses, ["available"]);
  assert.equal(new Set(registrationOptions.map(({ signal }) => signal)).size, 1);

  for (const tool of registeredTools) {
    await tool.execute(validInput, { signal: new AbortController().signal });
  }
  assert.deepEqual(
    activities.map(({ toolName, title, category, impact }) => ({
      toolName,
      title,
      category,
      impact,
    })),
    [
      {
        toolName: "get_denial_details",
        title: "Denial details accessed",
        category: "READ",
        impact: "No information changed",
      },
      {
        toolName: "get_coverage_requirements",
        title: "Coverage requirements accessed",
        category: "READ",
        impact: "No information changed",
      },
      {
        toolName: "list_appeal_evidence",
        title: "Appeal evidence accessed",
        category: "READ",
        impact: "No information changed",
      },
      {
        toolName: "check_appeal_readiness",
        title: "Appeal readiness checked",
        category: "READ",
        impact: "No information changed",
      },
    ],
  );
  assert.equal(activities.every(({ occurredAt }) => !Number.isNaN(Date.parse(occurredAt))), true);

  registration.unregister();
  assert.equal(registrationOptions.every(({ signal }) => signal.aborted), true);
  delete globalThis.document;
});

test("does not add activity when a tool rejects malformed input", async () => {
  const activities = [];
  const registeredTools = [];
  globalThis.document = {
    modelContext: {
      async registerTool(tool) {
        registeredTools.push(tool);
      },
    },
  };

  const registration = await caseTools.registerCaseTools({
    onActivity: (activity) => activities.push(activity),
    onStatusChange: () => undefined,
  });
  assert.throws(
    () => registeredTools[0].execute({}, { signal: new AbortController().signal }),
    /A valid case_id is required/,
  );
  assert.deepEqual(activities, []);

  registration.unregister();
  delete globalThis.document;
});

test("falls back safely when WebMCP is unavailable", async () => {
  const statuses = [];
  const registration = await caseTools.registerCaseTools({
    onActivity: () => assert.fail("Unavailable tools must not execute"),
    onStatusChange: (status) => statuses.push(status),
  });

  assert.deepEqual(statuses, ["unavailable"]);
  assert.doesNotThrow(() => registration.unregister());
});

test("read-layer eval scenarios cover safe tool selection boundaries", async () => {
  const evalPath = new URL("../evals/read-layer.json", import.meta.url);
  const evaluation = JSON.parse(await readFile(evalPath, "utf8"));

  assert.equal(evaluation.milestone, "02-read-layer");
  assert.equal(evaluation.scenarios.length, 6);
  assert.deepEqual(evaluation.scenarios[3].expected_tools, [
    "get_coverage_requirements",
    "list_appeal_evidence",
    "check_appeal_readiness",
  ]);
  assert.equal(
    evaluation.scenarios[3].expected_result.incomplete_requirement,
    "treatment_date_range",
  );
  assert.equal(evaluation.scenarios[4].expected_behavior.returns_success_probability, false);
  assert.deepEqual(evaluation.scenarios[5].expected_tools, []);
  assert.equal(evaluation.scenarios[5].expected_behavior.state_change, false);

  const serialized = JSON.stringify(evaluation);
  assert.doesNotMatch(serialized, /"(?:prepare_appeal|preview_appeal|submit_appeal)"/);
});
