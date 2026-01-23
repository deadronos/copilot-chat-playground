# Authentication — GitHub Copilot CLI 🔑

The CLI supports interactive OAuth and Personal Access Token (PAT) authentication.

Interactive OAuth

1. Launch the CLI: `copilot`
2. Run the `/login` slash command inside the interactive session:

```text
copilot
> /login
# Follow the on-screen instructions to authenticate via your browser
```

Personal Access Token (PAT)

- Create a PAT with the `Copilot Requests` permission at: [Create a personal access token](https://github.com/settings/personal-access-tokens/new)
- Export your token with one of the supported environment variables:

```bash
# Preferred (highest precedence)
export GH_TOKEN="ghp_your_personal_access_token"
# Alternative
export GITHUB_TOKEN="ghp_your_personal_access_token"
```

Precedence

- `GH_TOKEN` has the highest precedence; `GITHUB_TOKEN` is accepted as a fallback.

Security notes

- Treat PATs like secrets — do not commit them to source control.
- Use environment variables or a secure secrets manager to store PATs.

Source: Official docs and project README.