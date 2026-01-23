# Troubleshooting — Common issues & fixes 🛠️

1. Installation issues

- Problem: `copilot` command not found.
  - Fix: Ensure the install directory (e.g., `~/.local/bin` or `/usr/local/bin`) is on your `PATH`.
  - If you used Homebrew or winget, verify the package installed successfully and run `copilot --version`.

1. Authentication errors

- Problem: CLI shows unauthenticated or requests login repeatedly.

  - Fix: Run `copilot` and `/login` to authenticate via the browser, or export a valid PAT:

    ```bash
    export GH_TOKEN="ghp_..."
    copilot
    ```

  - Ensure the PAT has `Copilot Requests` permission.

1. Non-interactive scripts failing

- Problem: scripts that call `copilot -p` error out or require interactive confirmation.
  - Fixes:
    - Use `--allow-all` or `--allow-all-paths` to auto-approve permissions in CI usage.
    - Use `--silent` to suppress unnecessary output for automated parsing.

1. Model selection / behavior

- Problem: expected model not used
  - Fix: In an interactive session run `/model` and select the desired model or `/model <name>`.

1. Custom MCP or environment issues

- Problem: CLI can't communicate with a custom MCP server
  - Fix:
    - Check `~/.copilot/mcp-config.json` for correct command, args, and env variables.
    - Ensure any referenced env variables (API keys, access tokens) are exported in the calling environment.


If the above doesn't help, consult the project repository for issues and discussions or open a new issue: [github/copilot-cli](https://github.com/github/copilot-cli)

Source: Official docs and project README.
