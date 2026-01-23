# 07 — Provider / BYOK configuration

The Copilot SDK supports configuring a **provider** for “bring your own key” (BYOK) flows.

Use cases:

- experimenting with different providers
- routing through internal gateways
- testing local providers (where supported)

## Practical guidance

- Keep provider secrets out of logs.
- Prefer short timeouts + retries at your HTTP boundary.
- In a learning project, start with the default provider first; add BYOK later.

## Sources

- Copilot SDK repo README (mentions BYOK): <https://github.com/github/copilot-sdk>
