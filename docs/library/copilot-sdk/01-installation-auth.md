# 01 — Installation & authentication

## 1) Install Copilot CLI (required)

The Copilot SDK delegates authentication and API access to **Copilot CLI**.

Install Copilot CLI:

- Windows: via WinGet (`GitHub.Copilot`)
- macOS/Linux: Homebrew (`copilot-cli`)
- Any platform: npm global install (`@github/copilot`) **requires Node.js 22+**

Source: <https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli>

## 2) Authenticate Copilot CLI

You have two common options:

### Option A — interactive login (local dev)

Run Copilot CLI and use `/login` when prompted.

### Option B — environment token (recommended for containers)

Use a fine-grained PAT with **Copilot Requests** permission and set:

- `GH_TOKEN` (preferred)
- or `GITHUB_TOKEN`

The docs indicate precedence order: `GH_TOKEN` then `GITHUB_TOKEN`.

Source: <https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli>

## 3) Where should tokens live in this repo?

- Put tokens in `.env` (already gitignored).
- In Docker, pass tokens via `environment:` or `.env` injection.
- Never bake tokens into images.

## 4) Cost / usage note (premium requests)

Copilot requests can be billed/limited depending on your plan and model.
For a learning project, the key is simply: **each prompt can consume requests**.

Source: <https://docs.github.com/en/copilot/concepts/billing/copilot-requests>

## Troubleshooting checklist

- Copilot CLI installed? (`copilot --version`)
- Logged in or `GH_TOKEN` set?
- Organization policies allow Copilot CLI?

Sources:

- Copilot CLI install/auth: <https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli>
- Copilot CLI about/policies are linked from that page.
