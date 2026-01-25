/**
 * Centralized defaults for the Copilot package.
 * Keep defaults here so they're discoverable and easy to change across the codebase.
 */

export function getDefaultModel(): string {
  return (process.env.COPILOT_DEFAULT_MODEL as string) || "gpt-5-mini";
}
