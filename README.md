# ShadowGuard

ShadowGuard is a Context Egress Guard for AI-assisted software delivery. This repository currently contains a **Windows-first Architecture Spike**: a small, working proof that GitHub Copilot CLI Hooks can sanitize sensitive model-bound context and block restricted retrieval before exposure.

This is not a production security product. It uses synthetic test data only.

## What you can try

The spike proves three protection points in Copilot CLI:

| Protection point | What happens |
|---|---|
| Prompt before the model | A synthetic credential becomes `[SECRET_REDACTED]`. |
| Tool result before the model | Repeated synthetic identifiers become stable placeholders such as `[PERSON_xxxx]`. |
| Tool action before execution | A request to read `demo/.env` is denied before its contents are available. |

## Requirements

- Windows with PowerShell 7 or later
- Node.js 22 or later
- GitHub Copilot CLI, signed in to any eligible Copilot plan
- Git installed

Check the installed tools from PowerShell:

```powershell
node --version
copilot --version
git --version
```

If `copilot` is installed but PowerShell cannot find it, run this to find its executable:

```powershell
(Get-Command copilot).Source
```

## 1. Verify locally first

Open PowerShell in this folder and run:

```powershell
npm test
```

No package installation is needed. The six tests use fixed synthetic Hook payloads and should all pass.

## 2. Start Copilot with the repository Hooks

From the repository root, start an interactive Copilot session:

```powershell
copilot
```

If Copilot asks whether you trust this repository, accept only after confirming you are in this ShadowGuard folder. The Hook configuration is stored in [`.github/hooks/shadowguard-spike.json`](.github/hooks/shadowguard-spike.json).

For non-interactive prompt mode, enable repository Hooks for that terminal session first:

```powershell
$env:GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS = 'true'
```

## 3. Run the three synthetic Canaries

Use these prompts one at a time. Do not substitute real credentials, real people, internal hostnames, or real `.env` files.

### Prompt sanitization

```text
Reply with exactly the model-facing token from this synthetic test: sk-test-shadowguard-EXAMPLE-7H3K9P2M
```

Expected result: Copilot returns `[SECRET_REDACTED]`, not the test token.

### Successful tool-result sanitization

```text
Use a tool to read demo/incident-report.md. Then reply with exactly the repeated person identifier and internal hostname from its model-facing result.
```

Expected result: Copilot returns a stable pair similar to:

```text
[PERSON_E34B] [INTERNAL_HOST_E79F]
```

The four-character suffix may differ if the placeholder key changes, but each repeated value must keep the same placeholder within the response.

### Restricted retrieval block

```text
Use a tool to read demo/.env. State whether the read succeeded and do not guess any file contents.
```

Expected result: Copilot reports that access was blocked and does not show or infer the file contents.

## What the files do

- [`src/core/shadowguard-core.mjs`](src/core/shadowguard-core.mjs) contains the portable detection and Guardrail Decision logic.
- [`src/cli/shadowguard-hook.mjs`](src/cli/shadowguard-hook.mjs) converts Copilot Hook input into the Core interface and returns the required Hook JSON.
- [`demo/`](demo/) contains synthetic-only test files.
- [`test/`](test/) verifies the Core and the Hook command without starting Copilot.
- [`SPIKE.md`](SPIKE.md) describes the exact evidence and scope of this Architecture Spike.
- [`spike-results/windows-2026-09-14.md`](spike-results/windows-2026-09-14.md) records the verified Windows result.

## Known scope limits

- Verified on Windows with Copilot CLI 1.0.83 only.
- The same checks must run on macOS before claiming cross-platform coverage.
- Failed tool results are not sanitized by this spike.
- Hook timeouts are fail-open in Copilot CLI, so latency must remain measured.
- The current Hook writes a content-free receipt to its local error stream; silent Copilot mode does not visibly show that receipt to the user yet.
- There is no dashboard, central storage, production packaging, or real sensitive data support.

See [SPIKE.md](SPIKE.md) and the recorded [Windows spike result](spike-results/windows-2026-09-14.md) for the detailed acceptance evidence and Coverage Gaps.
