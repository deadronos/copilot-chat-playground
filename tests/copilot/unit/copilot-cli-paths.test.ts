import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { getCopilotCandidatePaths } from "../../src/copilot/src/copilot-cli.js";

describe("getCopilotCandidatePaths", () => {
  it("always includes 'copilot' and some node_modules .bin candidates", () => {
    const paths = getCopilotCandidatePaths();
    expect(paths.some((p) => p === "copilot")).toBe(true);
    expect(paths.some((p) => /node_modules[\\/].*\.bin[\\/].*copilot(\.cmd)?$/.test(p))).toBe(true);
  });

  it("returns deduplicated entries even if cwd is package dir", () => {
    const originalCwd = process.cwd;
    try {
      // Simulate starting from within the copilot package
      vi.spyOn(process, "cwd").mockReturnValue(path.resolve(__dirname, "..", "..", "src", "copilot"));
      const paths = getCopilotCandidatePaths();
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length); // no duplicates
    } finally {
      // Restore
      (process.cwd as any) = originalCwd;
    }
  });
});