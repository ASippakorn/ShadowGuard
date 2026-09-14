---
status: accepted
---

# Focus ShadowGuard on Context Egress

ShadowGuard will protect Sensitive Data from entering External AI through Covered Integrations, including preventing retrieval from Restricted Sources when the result is intended for Model-Bound Context. It will not become a general Agent Action or endpoint-security product: destructive commands and external transfers unrelated to Context Egress remain outside its boundary. This focus preserves a coherent product promise, limits false claims, and keeps the protection workflow centered on safe AI use rather than broad host control.

## Considered Options

- A general agent-security layer covering destructive commands, arbitrary network transfers, and Context Egress
- A focused Context Egress Guard with action checks only where they protect Model-Bound Context

The broader option was rejected because it combines different threat models, enforcement mechanisms, and buyer expectations.

## Consequences

- Agent-action inspection must be justified by a direct relationship to Model-Bound Context.
- Coverage is measured per named Integration, version, and checkpoint.
- General command safety and endpoint data-loss prevention require separate products or integrations.
