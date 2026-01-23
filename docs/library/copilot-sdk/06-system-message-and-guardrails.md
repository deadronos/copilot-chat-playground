# 06 — System message & guardrails

Copilot SDK lets you control the **system message**.

## Append vs replace

### Append (recommended)

You add instructions after the SDK’s standard guardrails.

Use this for:

- “always explain before acting”
- “use tools only when necessary”
- “prefer read-only tools”

### Replace (danger zone)

Replace removes SDK-managed guardrails.

Only use replace if you are deliberately experimenting and you understand the safety implications.

## What to put in a system message

For this repo’s playground:

- A short role description
- A tool usage policy (allowlist)
- A logging policy (“don’t output secrets”) — still enforce server-side!

## Sources

- Copilot SDK docs: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
