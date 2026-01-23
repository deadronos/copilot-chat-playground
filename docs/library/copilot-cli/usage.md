# Usage & Commands — GitHub Copilot CLI ⚙️

This page summarizes key interactive and non-interactive usage patterns and commonly-used commands.

Interactive session

- Start the CLI:

```bash
copilot
```

- Use slash commands in the interactive session to control behavior, for example:

```text
> /login       # authenticate
> /model       # open model picker
> /model gpt-5 # set model directly
```

- Execute shell commands from inside the Copilot session by prefixing with `!`:

```text
> !git status
> !npm test
```

- Use `copilot help` for a summary of available CLI flags and commands.

Selecting models

- Open the model picker with `/model` or set a model directly, e.g. `/model claude-sonnet-4.5`.
- Available models include (examples): `claude-sonnet-4.5`, `gpt-5`, `gpt-5.1-codex`.

Non-interactive usage (scripting)

See `automation.md` for details. Key flags include `-p` to pass a prompt and `--allow-all-paths` / `--allow-all` to auto-approve permissions for scripted runs.

Source: Official docs and CLI help output.
