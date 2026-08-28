import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const esbuild = fileURLToPath(new URL("../node_modules/.bin/esbuild", import.meta.url));
const entry = fileURLToPath(new URL("../webmcp/denial-tools.ts", import.meta.url));
const compiledTool = execFileSync(
  esbuild,
  [entry, "--bundle", "--platform=node", "--format=esm"],
  { encoding: "utf8" },
);
const moduleUrl =
  "data:text/javascript;base64," + Buffer.from(compiledTool).toString("base64");
const denialTools = await import(moduleUrl);

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

test("get_denial_details validates input and returns the concise denial record", () => {
  assert.deepEqual(
    denialTools.getDenialDetails({ case_id: "NS-PA-48291" }),
    expectedDetails,
  );
  assert.throws(
    () =>
      denialTools.getDenialDetails({
        case_id: "NS-PA-48291",
        unexpected: true,
      }),
    /Invalid input/,
  );
  assert.throws(
    () => denialTools.getDenialDetails({ case_id: "UNKNOWN" }),
    /Invalid input/,
  );
});

test("registers exactly one read-only tool and reports successful access", async () => {
  let registeredTool;
  let registrationOptions;
  const statuses = [];
  const accesses = [];

  globalThis.document = {
    modelContext: {
      async registerTool(tool, options) {
        assert.equal(registeredTool, undefined);
        registeredTool = tool;
        registrationOptions = options;
      },
    },
  };

  const registration = await denialTools.registerDenialDetailsTool({
    onAccess: (occurredAt) => accesses.push(occurredAt),
    onStatusChange: (status) => statuses.push(status),
  });

  assert.equal(registeredTool.name, "get_denial_details");
  assert.equal(registeredTool.annotations.readOnlyHint, true);
  assert.equal(registeredTool.annotations.untrustedContentHint, false);
  assert.equal(registeredTool.inputSchema.additionalProperties, false);
  assert.deepEqual(registeredTool.inputSchema.required, ["case_id"]);
  assert.deepEqual(
    await registeredTool.execute({ case_id: "NS-PA-48291" }),
    expectedDetails,
  );
  assert.deepEqual(statuses, ["available"]);
  assert.equal(accesses.length, 1);
  assert.doesNotThrow(() => new Date(accesses[0]).toISOString());

  registration.unregister();
  assert.equal(registrationOptions.signal.aborted, true);
  delete globalThis.document;
});

test("falls back safely when WebMCP is unavailable", async () => {
  const statuses = [];
  const registration = await denialTools.registerDenialDetailsTool({
    onAccess: () => assert.fail("Unavailable tools must not execute"),
    onStatusChange: (status) => statuses.push(status),
  });

  assert.deepEqual(statuses, ["unavailable"]);
  assert.doesNotThrow(() => registration.unregister());
});
