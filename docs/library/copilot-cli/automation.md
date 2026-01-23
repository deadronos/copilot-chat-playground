# Automation & Scripting — GitHub Copilot CLI 🤖

The Copilot CLI supports non-interactive runs for automation and CI workflows.

Basic single-prompt usage

```bash
# Execute a single prompt and print output
copilot -p "Create a Python function that calculates fibonacci numbers"
```

Common non-interactive flags

- `-p "<prompt>"` — run a single prompt and exit
- `--allow-all-paths` — auto-approve path permissions
- `--allow-all` — enable all requested permissions without prompting
- `--silent` — suppress stats and non-essential output
- `--agent <name>` — run the prompt with a specific agent

Examples

```bash
# Refactor a file and auto-approve path changes
copilot -p "Refactor the main.py file" --allow-all-paths

# Run tests and fix failures (auto-approve all changes)
copilot -p "Run tests and fix any failures" --allow-all

# Run in silent mode
copilot -p "Generate a README" --silent
```

Notes

- Non-interactive runs are useful in CI to automate simple tasks, documentation, or code transformations.
- When using automation that modifies code, ensure you have appropriate CI safeguards and code reviews.

Source: Official docs and examples.
