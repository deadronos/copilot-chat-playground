import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateToken } from "../../../src/copilot/src/copilot-cli.js";

describe("validateToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("should return valid=true when GH_TOKEN is set", () => {
    process.env.GH_TOKEN = "test_token";
    const result = validateToken();
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return valid=true when GITHUB_TOKEN is set", () => {
    process.env.GITHUB_TOKEN = "test_token";
    const result = validateToken();
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should prefer GH_TOKEN over GITHUB_TOKEN", () => {
    process.env.GH_TOKEN = "gh_token";
    process.env.GITHUB_TOKEN = "github_token";
    const result = validateToken();
    expect(result.valid).toBe(true);
  });

  it("should return valid=false when no token is set", () => {
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    const result = validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Missing GitHub token");
    expect(result.error).toContain("GH_TOKEN");
    expect(result.error).toContain("GITHUB_TOKEN");
  });

  it("should return valid=false when token is empty string", () => {
    process.env.GH_TOKEN = "";
    const result = validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should mention Copilot Requests permission in error message", () => {
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    const result = validateToken();
    expect(result.error).toContain("Copilot Requests");
  });
});
