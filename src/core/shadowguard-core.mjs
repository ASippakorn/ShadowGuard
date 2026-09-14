import { createHash } from "node:crypto";

const CREDENTIAL = /sk-test-shadowguard-[A-Za-z0-9-]+/g;
const PERSON_IDENTIFIER = /1234567890121/g;
const INTERNAL_HOST = /payments\.synthetic-bank\.invalid/g;
const RESTRICTED_ENV_PATH = /(?:^|[\\/])\.env(?:$|[\s"'])/i;

const hash = (value) => createHash("sha256")
  .update(`shadowguard-spike-local-key|${value}`)
  .digest("hex")
  .slice(0, 4)
  .toUpperCase();

const placeholder = (category, value) => `[${category}_${hash(`${category}|${value}`)}]`;

const addMatches = (findings, text, pattern, details) => {
  for (const match of text.matchAll(pattern)) {
    findings.push({
      ...details,
      start: match.index,
      end: match.index + match[0].length,
      value: match[0],
      replacement: details.toReplacement?.(match[0]) ?? null
    });
  }
};

const transform = (text, findings) => [...findings]
  .filter((finding) => finding.replacement !== null)
  .sort((left, right) => right.start - left.start)
  .reduce(
    (result, finding) => result.slice(0, finding.start) + finding.replacement + result.slice(finding.end),
    text
  );

const unique = (values) => [...new Set(values)];

const riskTier = (findings) => {
  const rank = { green: 0, yellow: 1, orange: 2, red: 3 };
  return findings.reduce(
    (highest, finding) => rank[finding.riskTier] > rank[highest] ? finding.riskTier : highest,
    "green"
  );
};

const contentFreeEvent = ({ stage, sessionId, decision, findings }) => ({
  id: `SG-SPIKE-${stage}`,
  integrationId: "copilot-cli",
  integrationVersion: "unverified-windows-spike",
  sessionIdHash: hash(`session|${sessionId || "unknown"}`),
  stage,
  destinationClass: "external_ai",
  decision,
  categories: unique(findings.map((finding) => finding.category)),
  findingCount: findings.length,
  riskTier: riskTier(findings),
  policyRuleIds: unique(findings.map((finding) => finding.policyRuleId)),
  durationMs: 0
});

const inspectText = (text) => {
  const findings = [];
  addMatches(findings, text, CREDENTIAL, {
    category: "credential",
    riskTier: "red",
    policyRuleId: "secret.credentials",
    toReplacement: () => "[SECRET_REDACTED]"
  });
  addMatches(findings, text, PERSON_IDENTIFIER, {
    category: "person_identifier",
    riskTier: "yellow",
    policyRuleId: "personal.identifiers",
    toReplacement: (value) => placeholder("PERSON", value)
  });
  addMatches(findings, text, INTERNAL_HOST, {
    category: "internal_hostname",
    riskTier: "yellow",
    policyRuleId: "internal.infrastructure",
    toReplacement: (value) => placeholder("INTERNAL_HOST", value)
  });

  findings.sort((left, right) => left.start - right.start);
  const decision = findings.length ? "transform" : "allow";
  return { decision: { kind: decision }, output: decision === "transform" ? transform(text, findings) : text, findings };
};

/**
 * Portable Core seam for the architecture spike.
 * The returned event is deliberately metadata-only and remains in memory.
 */
export const inspect = ({ stage, sessionId, text, actionArguments }) => {
  if (stage === "action_before_execute") {
    const argumentsText = typeof actionArguments === "string"
      ? actionArguments
      : JSON.stringify(actionArguments ?? {});
    const restricted = RESTRICTED_ENV_PATH.test(argumentsText);
    const findings = restricted ? [{
      category: "restricted_secret_file",
      riskTier: "red",
      policyRuleId: "restricted.secret_files"
    }] : [];
    const decision = restricted ? "block" : "allow";
    return {
      decision: restricted
        ? { kind: "block", reasonCode: "restricted_source_for_model_context" }
        : { kind: "allow" },
      output: null,
      event: contentFreeEvent({ stage, sessionId, decision, findings })
    };
  }

  if (!["content_before_model", "result_before_model"].includes(stage)) {
    throw new Error(`Unsupported inspection stage: ${stage}`);
  }

  const outcome = inspectText(text ?? "");
  return {
    decision: outcome.decision,
    output: outcome.output,
    event: contentFreeEvent({
      stage,
      sessionId,
      decision: outcome.decision.kind,
      findings: outcome.findings
    })
  };
};
