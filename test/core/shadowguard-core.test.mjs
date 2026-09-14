import assert from "node:assert/strict";
import test from "node:test";

import { inspect } from "../../src/core/shadowguard-core.mjs";

test("content_before_model redacts a synthetic credential and keeps event metadata content-free", () => {
  const rawPrompt = "Investigate SG-101 with sk-test-shadowguard-EXAMPLE-7H3K9P2M.";

  const result = inspect({
    stage: "content_before_model",
    sessionId: "synthetic-session-alpha",
    text: rawPrompt
  });

  assert.equal(result.decision.kind, "transform");
  assert.equal(result.output, "Investigate SG-101 with [SECRET_REDACTED].");
  assert.equal(result.event.decision, "transform");
  assert.deepEqual(result.event.categories, ["credential"]);
  assert.equal(JSON.stringify(result.event).includes(rawPrompt), false);
  assert.equal(JSON.stringify(result.event).includes("sk-test-shadowguard-"), false);
});

test("action_before_execute blocks a .env retrieval before any result is available", () => {
  const result = inspect({
    stage: "action_before_execute",
    sessionId: "synthetic-session-bravo",
    actionArguments: { path: ".\\demo\\.env" }
  });

  assert.equal(result.decision.kind, "block");
  assert.equal(result.decision.reasonCode, "restricted_source_for_model_context");
  assert.equal(result.output, null);
  assert.deepEqual(result.event.categories, ["restricted_secret_file"]);
});

test("result_before_model produces stable semantic placeholders for repeated synthetic values", () => {
  const rawResult = [
    "TEST-THAI-ID 1234567890121 contacted payments.synthetic-bank.invalid.",
    "1234567890121 later confirmed payments.synthetic-bank.invalid recovered."
  ].join(" ");

  const result = inspect({
    stage: "result_before_model",
    sessionId: "synthetic-session-charlie",
    text: rawResult
  });

  assert.equal(result.decision.kind, "transform");
  assert.equal(result.output.includes("1234567890121"), false);
  assert.equal(result.output.includes("payments.synthetic-bank.invalid"), false);
  assert.equal(result.event.findingCount, 4);

  const people = result.output.match(/\[PERSON_[A-F0-9]{4}\]/g);
  const hosts = result.output.match(/\[INTERNAL_HOST_[A-F0-9]{4}\]/g);
  assert.deepEqual(people, [people[0], people[0]]);
  assert.deepEqual(hosts, [hosts[0], hosts[0]]);
});
