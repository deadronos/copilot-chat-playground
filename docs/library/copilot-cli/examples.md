# Examples — Quick snippets for GitHub Copilot CLI ✨

## Launching and authentication

```bash
copilot            # Start interactive session
> /login           # Login via OAuth
```

## Select model

```text
> /model           # open model picker
> /model gpt-5     # set model to gpt-5
```

## Non-interactive prompts

```bash
copilot -p "Generate TypeScript types from this JSON schema" --silent
copilot -p "Refactor src/app.js" --allow-all-paths
```

## Run shell commands from session

```text
> !git status
> !npm test
```

## Automation example (CI)

```bash
# Run a prompt in CI and save output to a file
copilot -p "Generate a changelog from the commit history" --silent > changelog.md
```

Source: Official docs and examples.
