import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const runHook = (eventName, fixtureName) => {
  const fixture = readFileSync(new URL(`./fixtures/${fixtureName}`, import.meta.url), "utf8");
  const result = spawnSync(process.execPath, ["src/cli/shadowguard-hook.mjs", eventName], {
    cwd: new URL("..", import.meta.url),
    input: fixture,
    encoding: "utf8"
  });

  return {
    exitCode: result.status,
    stderr: result.stderr,
    output: JSON.parse(result.stdout)
  };
};

test("userPromptTransformed replaces the synthetic credential in model-facing content", () => {
  const result = runHook("userPromptTransformed", "user-prompt-transformed.json");

  assert.equal(result.exitCode, 0);
  assert.equal(result.output.modifiedTransformedPrompt.includes("sk-test-shadowguard-"), false);
  assert.equal(result.output.modifiedTransformedPrompt.includes("[SECRET_REDACTED]"), true);
});

test("preToolUse denies the synthetic .env retrieval", () => {
  const result = runHook("preToolUse", "pre-tool-use-env.json");

  assert.equal(result.exitCode, 0);
  assert.equal(result.output.permissionDecision, "deny");
  assert.equal(result.output.permissionDecisionReason, "restricted_source_for_model_context");
});

test("postToolUse replaces sensitive values in a successful result", () => {
  const result = runHook("postToolUse", "post-tool-use-incident-report.json");
  const output = result.output.modifiedResult.textResultForLlm;

  assert.equal(result.exitCode, 0);
  assert.equal(result.output.modifiedResult.resultType, "success");
  assert.equal(output.includes("1234567890121"), false);
  assert.equal(output.includes("payments.synthetic-bank.invalid"), false);
  assert.equal((output.match(/\[PERSON_[A-F0-9]{4}\]/g) || []).length, 2);
  assert.equal((output.match(/\[INTERNAL_HOST_[A-F0-9]{4}\]/g) || []).length, 2);
});
