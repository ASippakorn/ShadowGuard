# ShadowGuard Copilot CLI Architecture Spike

This is a narrow, Windows-first integration spike. It proves only three Context Egress checkpoints with synthetic data:

1. `userPromptTransformed` replaces a synthetic credential before model-facing content.
2. `preToolUse` denies a `.env` retrieval before tool execution.
3. `postToolUse` replaces sensitive values in a successful tool result before it becomes model-facing.

It does not provide persistence, a dashboard, production packaging, or a complete detector pack.

## Local verification

Run:

```text
npm test
```

All six tests must pass before a live Copilot run. They invoke the same command configured in [`.github/hooks/shadowguard-spike.json`](.github/hooks/shadowguard-spike.json), using fixed synthetic fixture payloads.

## Live Windows validation

Once the Copilot CLI command is available and signed in:

1. Record `copilot --version` in the spike result.
2. Start Copilot from this repository and trust this repository's Hook configuration.
3. Submit a prompt containing `sk-test-shadowguard-EXAMPLE-7H3K9P2M`. Confirm the model-facing response reflects `[SECRET_REDACTED]`.
4. Ask Copilot to read `demo/incident-report.md`. Confirm repeated values appear as stable `[PERSON_xxxx]` and `[INTERNAL_HOST_xxxx]` placeholders.
5. Ask Copilot to read `demo/.env`. Confirm it is denied before the tool runs.
6. Record the actual Hook payload shapes, Hook output, duration, CLI version, and any unobservable path as a Coverage Gap.

The hook configuration uses `exec` and `args` to launch Node directly, avoiding shell-specific quoting. Its two-second timeout is deliberate spike evidence: Copilot Hook timeouts are fail-open, so production policy must budget and measure startup latency.

## macOS follow-up

Use the same repository revision, Copilot CLI version where possible, Hook configuration, and synthetic files. Only claim cross-platform coverage after the same three live checks pass on macOS.
