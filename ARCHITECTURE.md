# ShadowGuard Product and Hackathon Architecture

This document deliberately separates the durable product idea from the bounded hackathon prototype. Product claims describe the direction of ShadowGuard. Prototype claims describe only behavior verified for a named integration, version, platform, and checkpoint.

## 1. Product Idea

### 1.1 Problem

Bank Employees use External AI and Coding Agents to understand, build, test, and operate software. Sensitive Data can enter Model-Bound Context through more than a pasted prompt:

- a Developer may include a credential, personal identifier, or internal hostname;
- a Coding Agent may retrieve a sensitive file or record;
- a successful local tool result may contain Sensitive Data before it is returned to the model.

Blocking all External AI removes useful productivity. Retrospective monitoring detects exposure only after it may have occurred. ShadowGuard therefore applies Runtime Protection while a covered interaction is still in progress.

ShadowGuard does not promise to discover every Shadow AI application. It protects only Covered Integrations whose observable checkpoints and enforcement capabilities have been verified.

### 1.2 Users and stakeholders

The primary user is a Developer performing AI-SDLC Work. The primary product outcome is that the Developer can continue using a Coding Agent with minimal interruption and useful context.

Security and Governance teams are stakeholders. They receive metadata-only evidence of policy enforcement without requiring ShadowGuard to retain Raw Prompts, tool results, detected values, or placeholder mappings.

### 1.3 Product promise

> ShadowGuard is an invisible, local-first Context Egress Guard for covered AI coding integrations. It sanitizes sensitive Model-Bound Context and prevents restricted retrieval before exposure to External AI, while preserving developer workflow and producing metadata-only governance evidence.

ShadowGuard prevents supported data paths from reaching External AI. It does not claim to control whether a provider trains on data after receipt; protection happens earlier by preventing the sensitive value from leaving the Trusted Data Boundary.

### 1.4 Product boundaries

#### In scope

- User-authored content exposed immediately before it becomes model-facing
- Agent Retrieval that would obtain a Restricted Source for model context
- Observable tool results exposed before they become model-facing
- Local detection, validation, policy evaluation, Sanitization, and pseudonymization
- Guardrail Decisions based on the capabilities of each Covered Integration
- Protection Receipts for concise user visibility
- Metadata-only Protection Events
- Measurable coverage and explicit Coverage Gaps per integration version

#### Out of scope

- Discovering unknown or unapproved AI applications
- Universal interception of every prompt, system instruction, provider context, or network request
- Guarantees about provider retention or model training after data has already left the boundary
- General endpoint security or broad Agent Action security
- Blocking destructive commands that have no relationship to Model-Bound Context
- MCP server, extension, or dependency vulnerability scanning
- Rehydrating placeholders into original sensitive values
- Storing Raw Prompts or Sensitive Data for centralized governance

### 1.5 Product principles

1. **Invisible by default.** High-confidence protection occurs automatically. Attention is requested only when a safe automatic outcome is unavailable and the integration supports a Review Gate.
2. **Preserve useful context.** Replace linkable non-secret values with semantic placeholders. Remove or generically replace credentials.
3. **Keep raw values local.** Inspection and handling of raw Sensitive Data stay inside the Trusted Data Boundary.
4. **Store evidence, not content.** Governance storage contains derived metadata only.
5. **Claim measured coverage.** Vendor neutrality describes the Core design, not universal protection. Effective coverage depends on each Adapter.
6. **Prefer deterministic evidence.** Validated rules precede probabilistic or ML-based detection.

### 1.6 Product outcome measures

Long-term product evaluation may include:

- percentage of interactions handled automatically;
- user intervention rate;
- context utility retention;
- task completion rate;
- detector precision and recall on a representative, governed evaluation set;
- number and type of prevented sensitive exposures;
- percentage of named interaction paths verified for each Covered Integration;
- governance review effort.

ShadowGuard must not use “AI applications detected” as a Runtime Protection metric because Shadow AI Discovery is a separate capability.

## 2. Product Architecture

### 2.1 System view

~~~mermaid
flowchart LR
    DEV[Developer] --> IE[Integration Endpoint]

    subgraph TB[Trusted Data Boundary: managed endpoint]
        IE --> IA[Integration Adapter]
        IA --> CORE[ShadowGuard Core]
        CORE --> IA
        IA --> IE

        POLICY[Local Policy Profile] --> CORE
        KEY[Local Device Key] --> CORE
        CORE --> EVENTS[(Local Event Store)]
        EVENTS --> DASH[Local Governance View]
    end

    IE --> AI[External AI]
    EVENTS -. Approved governance metadata .-> GOV[Future Organization Governance]
~~~

External AI is outside the Trusted Data Boundary. A future organization service may receive approved Governance Metadata, but never Raw Prompts, detected values, transformed content, or placeholder mappings from ShadowGuard.

### 2.2 Interaction path

The complete protected path is:

~~~text
Observable Integration Checkpoint
    -> Integration Adapter
    -> ShadowGuard Core
    -> Guardrail Decision
    -> Integration Adapter
    -> Enforceable Integration Response
~~~

An Integration Endpoint may be a vendor hook, gateway, browser extension, IDE extension, or Controlled Client. A hook is one possible mechanism, not the definition of the product.

### 2.3 Context Egress checkpoints

ShadowGuard uses three normalized stages:

| Stage | Purpose | Typical targets |
|---|---|---|
| content_before_model | Inspect submitted content exposed before the model receives it | Prompt text and submitted model-facing arguments |
| action_before_execute | Prevent retrieval of a Restricted Source intended for model context | Tool name, path, command, destination, and arguments |
| result_before_model | Inspect an observable successful tool result before it returns to model context | Model-facing result text |

The action checkpoint is an upstream Context Egress control. It is not a general command-security boundary. For example:

- reading incident-report.md may be allowed because its useful content can be sanitized later;
- reading .env may be blocked because credentials should not be retrieved for model context at all;
- an unrelated destructive command is outside the ShadowGuard product boundary.

### 2.4 Integration model

~~~mermaid
flowchart LR
    CP[Copilot CLI Hooks] --> CPA[Copilot Adapter]
    SDK[Controlled Client] --> SDKA[Client Adapter]
    GW[Local AI Gateway] --> GWA[Gateway Adapter]
    BR[Browser Extension] --> BRA[Browser Adapter]
    IDE[IDE Extension] --> IDEA[IDE Adapter]

    CPA --> CORE[ShadowGuard Core]
    SDKA --> CORE
    GWA --> CORE
    BRA --> CORE
    IDEA --> CORE
~~~

The Core is vendor-neutral. Every Integration Adapter must:

1. declare stage-specific enforcement capabilities;
2. normalize vendor input into typed Inspection Targets;
3. translate a Guardrail Decision into a response the integration can enforce;
4. reject an incompatible decision instead of silently weakening it;
5. identify its integration and tested version in Protection Events;
6. publish verified checkpoints and Coverage Gaps.

Only the Copilot Adapter is part of the hackathon prototype. Other Adapters express future product direction.

### 2.5 Core interface

The central seam is a single Core interface. Target identifiers make multi-target transformations explicit.

~~~ts
type InspectionStage =
  | "content_before_model"
  | "action_before_execute"
  | "result_before_model";

type EnforcementCapabilities = {
  canTransform: boolean;
  canBlock: boolean;
  canReviewInteractively: boolean;
};

type InspectionTarget =
  | {
      id: string;
      kind: "text";
      value: string;
      contentKind: "prompt" | "tool_result" | "argument";
    }
  | { id: string; kind: "path"; value: string }
  | { id: string; kind: "command"; value: string }
  | { id: string; kind: "destination"; value: string };

type TargetReplacement = {
  targetId: string;
  value: string;
};

type ProtectionDecision =
  | { kind: "allow"; event: ProtectionEvent }
  | {
      kind: "transform";
      replacements: TargetReplacement[];
      event: ProtectionEvent;
    }
  | {
      kind: "review";
      safeDefault: "transform" | "block";
      event: ProtectionEvent;
    }
  | {
      kind: "block";
      reasonCode: string;
      event: ProtectionEvent;
    };

type InspectionInput = {
  integrationId: string;
  integrationVersion?: string;
  stage: InspectionStage;
  sessionId: string;
  repository?: string;
  environment?: "local" | "test" | "production" | "unknown";
  capabilities: EnforcementCapabilities;
  targets: InspectionTarget[];
  actionName?: string;
};

interface ShadowGuardCore {
  inspect(input: InspectionInput): Promise<ProtectionDecision>;
}
~~~

Callers and tests use the same interface. Detection rules, validation, risk classification, policy evaluation, pseudonymization, and safe-fallback selection remain private to the Core.

### 2.6 Internal processing

~~~text
Normalize typed targets
    -> Route detectors by stage and target kind
    -> Detect candidate sensitive spans or restricted retrieval
    -> Validate candidates
    -> Assign Detection Confidence
    -> Assign Risk Tier
    -> Apply the Policy Profile
    -> Select an enforceable decision or safe fallback
    -> Return replacements or block
    -> Emit a metadata-only Protection Event
~~~

The stage answers **when** to inspect. The target kind answers **where** to inspect. The Adapter extracts data but never assigns business risk.

### 2.7 Detection and validation

Initial detector families are deterministic:

- API tokens, JWTs, private keys, and credential assignments;
- .env, key, certificate, and secret path policies;
- Thai citizen identifiers with checksum validation;
- payment cards with Luhn validation;
- bank-account-shaped identifiers when defined by a governed fixture or policy;
- email addresses and phone numbers;
- configured internal hostnames, private IP ranges, and organization domains.

Generic source code is not inherently Sensitive Data. An Organization Policy may mark a repository or path as restricted, but ShadowGuard must not claim to infer proprietary source code without a defined classifier and evaluation set.

ML detection is deferred until deterministic detection, validation, policy evaluation, and enforcement work end to end.

### 2.8 Risk and policy

Risk Tier describes business impact. Detection Confidence describes the strength of the evidence. They are independent.

| Tier | Default product behavior | Example |
|---|---|---|
| Green | Allow silently | No governed finding |
| Yellow | Sanitize automatically | Valid linkable personal identifier |
| Orange | Review when supported; otherwise use the configured safe default | Ambiguous internal identifier |
| Red | Sanitize or block according to data and stage | Credential or Restricted Source |

An integration that cannot pause for review must never downgrade Review to Allow. The Core selects Transform or Block as the safe fallback declared by policy.

Policy configuration may contain categories, restricted paths, approved destination classes, environment tags, and modes. It must not contain real customer identifiers or credential values.

### 2.9 Policy initialization

shadowguard init creates a Policy Profile. It does not classify and store every repository value in advance.

The initializer merges these sources from least to most authoritative:

1. built-in rules for credentials and common secret paths;
2. a selected industry profile, such as banking-balanced;
3. repository context explicitly confirmed by the team;
4. organization-managed rules.

More authoritative rules may make policy stricter but must not silently weaken mandatory rules. Initialization may inspect filenames and repository metadata to propose settings, but it must not persist raw file content or inferred secrets in policy.

Example:

~~~yaml
version: 1
profile: banking-balanced
mode: balanced

rules:
  - id: secret.credentials
    when:
      stages: [content_before_model, result_before_model]
      detectors: [api_key, jwt, private_key]
    risk: red
    action: transform

  - id: restricted.secret_files
    when:
      stages: [action_before_execute]
      paths: ["**/.env", "**/*.pem", "**/*.key"]
    risk: red
    action: block
~~~

### 2.10 Context-preserving placeholders

Semantic placeholders retain roles and relationships:

~~~text
[PERSON_A31F]
[ACCOUNT_9B20]
[INTERNAL_HOST_4C12]
[SECRET_REDACTED]
~~~

For linkable, non-credential data, the suffix is derived from a keyed digest of category and value. This preserves equality across an interaction without storing the original value. Credentials always use a non-linkable generic placeholder.

The device key remains local and must never be written to the repository, Protection Event, or centralized governance system.

### 2.11 Governance event

~~~ts
type ProtectionEvent = {
  id: string;
  timestamp: string;
  integrationId: string;
  integrationVersion?: string;
  sessionIdHash: string;
  repositoryHash?: string;
  stage: InspectionStage;
  destinationClass: "external_ai" | "trusted" | "unknown";
  decision: "allow" | "transform" | "review" | "block";
  categories: string[];
  findingCount: number;
  riskTier: "green" | "yellow" | "orange" | "red";
  policyRuleIds: string[];
  durationMs: number;
};
~~~

A Protection Event must not contain:

- Raw Prompts;
- tool arguments or results;
- detected values;
- transformed content;
- placeholder mappings;
- device-key material.

Protection Receipts are concise views derived from Protection Events. They confirm the stage, decision, category count, Risk Tier, duration, and event identifier without showing content.

### 2.12 Storage and dashboard

- Runtime protection works without the dashboard.
- The local prototype uses one SQLite database in WAL mode.
- The hook process writes Protection Events directly.
- The dashboard is read-only and starts only when requested.
- Tests use an in-memory event adapter.
- Future organization governance may receive explicitly approved Governance Metadata, not content.

## 3. Hackathon Prototype

### 3.1 Prototype objective

The prototype proves that ShadowGuard can operate inside a real Copilot CLI workflow at three documented checkpoints. It is not a production bank deployment, a universal AI interceptor, or a statistically validated detection product.

### 3.2 Prototype boundary

#### Included

- GitHub Copilot CLI
- A native hook-based Copilot Adapter
- macOS as the demonstrated platform
- A portable Core and configuration model
- One packaged local executable
- Canary-based checkpoint verification
- Deterministic demo detectors
- Context-preserving placeholders
- Protection Receipts
- Metadata-only local SQLite events
- A minimal read-only Local Dashboard and Demo Verification Panel

#### Excluded

- Browser and IDE interception
- Shadow AI Discovery
- Interactive review before prompt submission
- A ShadowGuard wrapper or replacement CLI
- A Controlled Client
- Centralized enterprise governance
- Enterprise identity, roles, and managed rollout
- Windows as a second demo platform
- ML detection
- Production-grade bank deployment

### 3.3 Verified Copilot hook capabilities

The prototype assumptions were checked against the official [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference) on 2026-09-14. They remain version-sensitive and must be verified against the installed CLI during the Architecture Spike.

| Copilot checkpoint | Prototype use | Documented capability | Important limit |
|---|---|---|---|
| userPromptTransformed | Sanitize submitted prompt content | Return modifiedTransformedPrompt | Mutation only; cannot block or request review |
| preToolUse | Deny retrieval from a Restricted Source | Allow, deny, ask, or modify arguments | Coverage depends on the tool name and meaningful arguments being exposed |
| postToolUse | Sanitize a successful model-facing tool result | Return a modified successful result | Does not cover failed tool output |

The Copilot Adapter declares different capabilities at each stage. Prompt ambiguity therefore falls back to automatic Sanitization or Block according to policy; it never silently becomes Allow.

The Adapter must accept both a parsed object and a JSON string for camel-case preToolUse arguments until the installed CLI payload is captured, because GitHub reference and tutorial material have differed on this shape.

### 3.4 Cross-platform execution

The Core, policy engine, detectors, pseudonymizer, and event store remain operating-system independent. Integration installation and process-launch configuration may vary.

For the hackathon:

- demonstrate and verify the full path on macOS;
- prefer one packaged executable launched with exec and args;
- keep paths, quoting, and vendor payload handling inside the Copilot Adapter;
- treat Windows as a packaging and automated-test target when a runner is available, not a second demo platform.

### 3.5 Synthetic demo assets

All demo values are synthetic and unmistakably marked as test data.

- A submitted prompt contains a synthetic API credential.
- incident-report.md contains a checksum-valid synthetic Thai citizen identifier and a configured internal hostname.
- .env represents a Restricted Source and contains only synthetic credentials.
- Canary markers exist for prompt, successful tool-result, restricted-retrieval, and storage checks.

No real customer, employee, bank, repository, hostname, or credential value may be used.

### 3.6 Demo narrative

1. A Developer opens the synthetic incident report so judges can see the starting data.
2. The Developer asks Copilot to investigate a production-style incident and accidentally includes a synthetic API credential.
3. userPromptTransformed sanitizes the credential automatically and emits a Protection Receipt.
4. Copilot continues with a useful response containing [SECRET_REDACTED], not the original value.
5. Copilot reads incident-report.md.
6. postToolUse replaces the Thai citizen identifier and internal hostname before the successful result becomes model-facing.
7. Copilot summarizes the incident using stable [PERSON_xxxx] and [INTERNAL_HOST_xxxx] placeholders.
8. Copilot attempts to read .env for more detail.
9. preToolUse denies the Restricted Source before tool execution and emits a reason.
10. The Local Dashboard shows the three Protection Events and the Demo Verification Panel confirms that no Canary entered governance storage.

The user continues using native Copilot CLI throughout. There is no Protect & Send screen and no per-prompt Approval Dialog.

### 3.7 User-visible evidence

The invisible layer is made demonstrable through three forms of evidence:

1. **Protection Receipt in the terminal**

   ~~~text
   ShadowGuard | Prompt protected
   1 credential sanitized | Red | 24 ms | SG-001
   ~~~

2. **Context-preserving placeholders in the Copilot response**

   The model can reason about the same person and host without receiving the original values.

3. **Local Dashboard with Demo Verification Panel**

   The dashboard shows:

   - Covered Integration and tested version;
   - Inspection Stage;
   - Risk Tier;
   - categories and count;
   - Guardrail Decision;
   - duration;
   - coverage verification status.

   It never shows the Raw Prompt, Sanitized Prompt, detected values, or placeholder mappings.

The Demo Verification Panel is prototype evidence, not a core product feature:

~~~text
PASS  Prompt Canary absent from model-bound content
PASS  Tool-result Canary absent from model-bound content
PASS  Restricted retrieval denied before execution
PASS  Canary absent from governance storage
~~~

### 3.8 Prototype detector set

The judge-facing prototype implements:

- an API credential detector;
- a Thai citizen identifier detector with checksum validation;
- an internal hostname detector driven by the Policy Profile;
- a Restricted Source path rule for .env;
- Canary detectors and assertions for verification.

Generic source-code classification, payment cards, bank identifiers, email, phone, and ML-based semantic classification are not required for the first prototype.

### 3.9 Suggested repository layout

~~~text
shadowguard/
+-- src/
|   +-- core/
|   |   +-- shadowguard-core.ts
|   |   +-- detectors/
|   |   +-- policy/
|   |   +-- pseudonymizer/
|   |   +-- enforcement-planner/
|   +-- adapters/
|   |   +-- integrations/
|   |   |   +-- copilot/
|   |   +-- events/
|   +-- cli/
|   +-- dashboard/
+-- config/
|   +-- banking-balanced.policy.yaml
+-- demo/
|   +-- incident-report.md
|   +-- synthetic.env
+-- test/
|   +-- core/
|   +-- adapters/
|   +-- fixtures/
|   +-- canary/
+-- .github/hooks/
|   +-- shadowguard.json
+-- CONTEXT.md
+-- package.json
~~~

## 4. Verification Plan

### 4.1 Architecture Spike

Complete the spike before building the Local Dashboard:

1. Pin and record the tested Copilot CLI version.
2. Register userPromptTransformed, preToolUse, and postToolUse in one macOS test repository.
3. Capture synthetic payload fixtures for every targeted tool and stage.
4. Implement a thin Copilot Adapter with stage-specific capabilities.
5. Implement ShadowGuardCore.inspect with Canary detection and metadata-only in-memory events.
6. Prove prompt transformation.
7. Prove denial of .env retrieval before execution.
8. Prove successful tool-result transformation.
9. Prove that no Canary value exists in a Protection Event.
10. Record every unobservable or unenforceable path as a Coverage Gap.

### 4.2 Acceptance criteria

The Architecture Spike passes only when:

1. the Prompt Canary is absent from the transformed model-facing prompt;
2. the Tool Result Canary is absent from the transformed successful model-facing result;
3. .env retrieval receives a deny decision before tool execution;
4. no raw Canary appears in Protection Events or SQLite;
5. a content-free Protection Receipt matches every Guardrail Decision;
6. every path that could not be proved is recorded as a Coverage Gap.

### 4.3 Performance target

The target is p95 below 300 ms across 100 independent local hook invocations. Measurement includes:

- packaged executable startup;
- Adapter normalization and response translation;
- Core detection and policy evaluation;
- placeholder generation;
- SQLite event writing.

It excludes Copilot and model response time. The result is a prototype latency measurement, not a production service-level objective.

### 4.4 Detector verification

- Use fixed synthetic positive and negative fixtures.
- All seeded judge-facing demo cases must pass.
- Invalid Thai identifiers must not match the checksum-valid category.
- Repeated linkable values must receive the same placeholder within the defined key scope.
- Credentials must never receive linkable placeholders.
- Do not publish production precision, recall, false-positive, or false-negative claims from the small prototype fixture set.

### 4.5 Context Preservation check

The demo passes its utility check when Copilot can:

- identify the incident type and affected components;
- preserve the relationship between repeated person and hostname placeholders;
- produce a useful summary without any original Sensitive Data.

This is a bounded qualitative demonstration, not a statistically validated utility metric.

### 4.6 Go, Reduce Scope, or Pivot

- **Go:** all three checkpoints meet the acceptance criteria.
- **Reduce Scope:** prompt transformation works but a targeted tool path is not observable or controllable; remove that path from the demo and claim only verified coverage.
- **Pivot:** prompt transformation is unreliable; build a narrow Controlled Client as a separately labeled prototype instead of adding a network proxy or pretending the hook path is protected.

### 4.7 Explicit Coverage Gaps

The Copilot CLI hook prototype does not cover:

- system context or provider-internal context not exposed by hooks;
- failed tool-result text through postToolUse transformation;
- actions outside the Copilot tool lifecycle;
- tool calls whose relevant path or arguments are not exposed;
- hook timeouts, which are fail-open;
- unknown ordering or composition behavior until verified with installed-version fixtures;
- tamper-resistant enterprise enforcement when repository-level hooks can be disabled;
- local Copilot history, which may retain the original Raw Prompt inside the Trusted Data Boundary;
- any AI application other than the tested Copilot CLI integration.

ShadowGuard does not erase vendor-local history. Its storage guarantee applies to ShadowGuard Governance Storage.

## 5. Future Product Direction

Future work may include:

- additional Covered Integrations for IDEs, browsers, gateways, and coding agents;
- organization-managed Policy Profiles and tamper-resistant deployment mechanisms;
- centralized aggregation of approved Governance Metadata;
- Windows installation and managed-policy distribution;
- broader deterministic detector packs backed by governed evaluation sets;
- a Controlled Client for organizations requiring per-prompt review before submission.

A Controlled Client should use an official host application interface rather than terminal interception. GitHub's Copilot SDK can provide host-owned prompt submission and tool hooks, but it currently replaces parts of the native CLI experience and is in public preview. It is therefore a future Adapter, not the hackathon prototype.

## 6. Engineering Constraints

- Keep Integration Adapters thin; all business-risk decisions belong to the Core.
- Keep vendor payload and response types inside their Adapter.
- Treat enforcement capabilities as stage-specific data.
- Never downgrade Review or Block to Allow because an integration lacks capability.
- Reject target replacements that do not map to a known target identifier.
- Never log raw vendor payloads outside synthetic test fixtures.
- Never put real Sensitive Data in demo assets, policy, tests, or documentation.
- Keep the protection path local and free of network dependencies.
- Record duration for every completed decision.
- Treat hook failure and timeout behavior as Coverage Gaps, not hidden implementation details.
- Build and verify the three protection checkpoints before the dashboard.
