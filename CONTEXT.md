# ShadowGuard

ShadowGuard is an AI-SDLC guardrail context for practitioners in a banking organization who use external coding agents. It exists to reduce information and execution risk without removing the productivity benefit of AI-assisted software delivery.

## People and environment

**Bank Employee**:
A person working for the Banking Organization who participates in AI-assisted software delivery. This includes development, analysis, architecture, quality, and security roles.
_Avoid_: End user, generic user

**Developer**:
A Bank Employee whose AI usage may include source code, command-line input, credentials, configuration, or technical records.
_Avoid_: Programmer user, technical end user

**Banking Organization**:
The regulated enterprise whose sensitive information and policies ShadowGuard protects.
_Avoid_: Customer, client

**External AI**:
An AI service outside the Banking Organization's Trusted Data Boundary that receives Model-Bound Context.
_Avoid_: AI platform, chatbot

**AI-SDLC Work**:
Software-delivery activity in which a Bank Employee uses an External AI to understand, design, create, test, review, or operate software.
_Avoid_: AI usage, coding task

**Coding Agent**:
An External AI that can reason about a software workspace and propose or perform actions during AI-SDLC Work.
_Avoid_: Coding assistant, chatbot

## Prompt protection

**Raw Prompt**:
The original content a Bank Employee intends to submit to an External AI, before ShadowGuard makes any protection change.
_Avoid_: Original query, user input

**Sensitive Data**:
Information in a Raw Prompt whose disclosure may create security, privacy, regulatory, or business risk for the Banking Organization.
_Avoid_: Secret data, unsafe text

**Sensitive Span**:
A specific portion of a Raw Prompt identified as Sensitive Data and presented as one protection decision.
_Avoid_: Finding, match

**Sanitization**:
The replacement or transformation of a Sensitive Span so its original value is not disclosed to an External AI.
_Avoid_: Cleaning, deletion, masking

**Placeholder**:
A stable, meaningful substitute for a Sensitive Span that represents its role without revealing its original value.
_Avoid_: Mask, dummy value

**Context Preservation**:
The property that a Sanitized Prompt retains enough meaning, relationships, and structure for the External AI to produce a useful response.
_Avoid_: Data preservation, prompt quality

**Protection Suggestion**:
A proposed Sanitization of one or more Sensitive Spans that a Bank Employee may review before submission.
_Avoid_: Alert, warning popup

**User Decision**:
The Bank Employee's explicit choice to accept, modify, or decline a Protection Suggestion.
_Avoid_: Override, consent

**Sanitized Prompt**:
A Raw Prompt in which accepted Protection Suggestions have replaced or transformed their Sensitive Spans while aiming to preserve context.
_Avoid_: Safe prompt, cleaned prompt

**Model-Bound Context**:
Any prompt, file content, command output, retrieved record, or other material that is about to cross the Trusted Data Boundary and become visible to an External AI.
_Avoid_: Prompt, tool output

**Agent Retrieval**:
An Agent Action that obtains information from a workspace, command, service, or other source for use during AI-SDLC Work.
_Avoid_: Prompt input, file read

**Restricted Source**:
An information source that a Policy Profile identifies as too sensitive to retrieve for Model-Bound Context.
_Avoid_: Dangerous file, blocked path

**Context Egress**:
The moment Model-Bound Context crosses the Trusted Data Boundary toward an External AI, regardless of whether the content originated from a person or an Agent Retrieval.
_Avoid_: Prompt submission, network request

**Egress Gate**:
The final governance checkpoint that evaluates Model-Bound Context before Context Egress.
_Avoid_: Prompt filter, detector

**Invisible Protection Layer**:
The ShadowGuard experience in which high-confidence protection occurs automatically within the employee's normal workflow and requires attention only when a safe automatic outcome is unavailable.
_Avoid_: Background scanner, blocker

**Protection Receipt**:
A concise, content-free confirmation that ShadowGuard applied a Guardrail Decision during an interaction.
_Avoid_: Approval dialog, security popup

**Local-First Protection**:
The principle that inspection and handling of raw Sensitive Data remain inside the Trusted Data Boundary, while approved Governance Metadata may be shared for organizational oversight.
_Avoid_: Local-only, cloud detection

**Guardrail Decision**:
ShadowGuard's outcome for an evaluated prompt or agent action: allow silently, sanitize automatically, request review, or block.
_Avoid_: Security result, verdict

**Review Gate**:
A deliberate pause requesting a User Decision when risk or uncertainty is too high for a silent Guardrail Decision.
_Avoid_: Warning, popup, approval fatigue

**Agent Action**:
An operation proposed by a Coding Agent that may read, modify, transmit, or execute something within AI-SDLC Work.
_Avoid_: Tool call, command

**Risk Tier**:
The business-impact class assigned to Sensitive Data or an Agent Action, used to determine the appropriate Guardrail Decision.
_Avoid_: Severity score, confidence score

**Detection Confidence**:
The strength of evidence that an Inspection Target belongs to a detected category; it is independent of the business impact expressed by Risk Tier.
_Avoid_: Risk score, severity

**Inspection Target**:
A specific piece of an observed interaction that ShadowGuard evaluates, such as model-bound text, a file path, a command, or a destination.
_Avoid_: Payload, whole event

**Policy Profile**:
The named set of governance rules that maps detected categories and interaction context to Guardrail Decisions for a particular working environment.
_Avoid_: Detector configuration, model profile

**Trusted Destination**:
A destination explicitly approved by the Banking Organization to receive a defined class of Model-Bound Context.
_Avoid_: Safe website, allowlist entry

## Governance

**Shadow AI**:
AI tools or AI-enabled activity used within the Banking Organization without sufficient approval, visibility, or governance.
_Avoid_: External AI, Coding Agent

**Shadow AI Discovery**:
The organizational capability of identifying previously unknown or unapproved Shadow AI usage across people, tools, and channels.
_Avoid_: Runtime protection, prompt inspection

**Runtime Protection**:
Governance applied through a Covered Integration while Model-Bound Context or an Agent Action is still in progress.
_Avoid_: Shadow AI discovery, retrospective monitoring

**Covered Integration**:
A named interaction channel whose observable checkpoints and enforceable Guardrail Decisions have been verified for a specific integration version.
_Avoid_: Supported AI application, universal coverage

**Controlled Client**:
A ShadowGuard-owned AI interaction surface that holds Model-Bound Context before submission and can request a User Decision independently of a vendor's native interface.
_Avoid_: Transparent wrapper, native integration

**Coverage Gap**:
A path by which Model-Bound Context or an Agent Action can bypass the Runtime Protection checkpoints observed by ShadowGuard.
_Avoid_: Detection miss, false negative

**Protection Event**:
A record that prompt protection was evaluated, including risk categories and the User Decision, without containing the original Sensitive Data.
_Avoid_: Audit log, prompt history

**Governance Metadata**:
Non-content information derived from Protection Events for organizational visibility, such as risk category, count, channel, time, and decision outcome.
_Avoid_: Usage data, sanitized data

**Trusted Data Boundary**:
The devices and systems approved by the Banking Organization to handle Raw Prompts and Sensitive Data.
_Avoid_: Local network, secure zone
