import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { checkWorkspaceMount } from "../../../src/copilot/src/workspace-guard.js";

describe("checkWorkspaceMount", () => {
  let tempDir: string | undefined;

  beforeEach(() => {
    tempDir = undefined;
  });

  afterEach(async () => {
    if (tempDir) {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        // ignore cleanup errors
      }
    }
    vi.restoreAllMocks();
  });

  it("returns exists=false when path is missing and logs a warning with event_type and message", async () => {
    const fakeEventBus = { emitLog: vi.fn() };
    const missingPath = path.join(os.tmpdir(), `workspace-missing-${Date.now()}`);

    const status = await checkWorkspaceMount(missingPath, fakeEventBus as any);

    expect(status.exists).toBe(false);
    expect(status.readable).toBe(false);
    expect(status.writable).toBe(false);

    // Ensure we emitted a warning with structured fields
    expect((fakeEventBus.emitLog as any).mock.calls.length).toBeGreaterThan(0);
    const call = (fakeEventBus.emitLog as any).mock.calls[0][0];
    expect(call.level).toBe("warn");
    expect(call.event_type).toBe("workspace.mount.missing");
    expect(call.message).toContain(missingPath);
  });

  it("detects read-only behavior when write throws EACCES and includes event_type/message and files", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    // create a readable file so the dir is not empty (just a sanity check)
    await fs.promises.writeFile(path.join(tempDir, "file.txt"), "hello");

    // Mock write to throw permission error to simulate read-only mount
    vi.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(Object.assign(new Error("permission denied"), { code: "EACCES" }));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(true);
    expect(status.writable).toBe(false);

    // readdir should have populated files
    expect(Array.isArray(status.files)).toBe(true);
    expect(status.files).toContain("file.txt");

    // Should have logged an informational message and a warning about read-only
    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const levels = calls.map((c: any) => c.level);
    expect(levels).toContain("info");
    expect(levels).toContain("warn");

    // Find the read-only warning and assert structured fields
    const readOnlyCall = calls.find((c: any) => c.event_type === "workspace.mount.read_only");
    expect(readOnlyCall).toBeTruthy();
    expect(readOnlyCall.message).toContain("read-only");
  });

  it("detects read-only behavior when write throws EPERM", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    await fs.promises.writeFile(path.join(tempDir, "file.txt"), "hello");

    vi.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(Object.assign(new Error("operation not permitted"), { code: "EPERM" }));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(true);
    expect(status.writable).toBe(false);

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const readOnlyCall = calls.find((c: any) => c.event_type === "workspace.mount.read_only");
    expect(readOnlyCall).toBeTruthy();
    expect(readOnlyCall.message).toContain("read-only");
  });

  it("reports a write_error when write fails for other reasons", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    await fs.promises.writeFile(path.join(tempDir, "file.txt"), "hello");

    vi.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(new Error("disk full"));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(true);
    expect(status.writable).toBe(false);

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const writeErrorCall = calls.find((c: any) => c.event_type === "workspace.mount.write_error");
    expect(writeErrorCall).toBeTruthy();
    expect(writeErrorCall.message).toContain("disk full");
  });

  it("handles readdir failure and leaves status.files undefined while logging visible event", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    await fs.promises.writeFile(path.join(tempDir, "file.txt"), "hello");

    vi.spyOn(fs.promises, "readdir").mockRejectedValueOnce(new Error("I/O failure"));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(true);
    expect(status.files).toBeUndefined();

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const visibleCall = calls.find((c: any) => c.event_type === "workspace.mount.visible");
    expect(visibleCall).toBeTruthy();
    expect(visibleCall.message).toContain("could not enumerate entries");
  });

  it("populates status.files on successful readdir and emits visible event", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    await fs.promises.writeFile(path.join(tempDir, "a.txt"), "a");
    await fs.promises.writeFile(path.join(tempDir, "b.txt"), "b");

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(true);
    expect(Array.isArray(status.files)).toBe(true);
    expect(status.files).toEqual(expect.arrayContaining(["a.txt", "b.txt"]));

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const visibleCall = calls.find((c: any) => c.event_type === "workspace.mount.visible");
    expect(visibleCall).toBeTruthy();
    expect(visibleCall.message).toContain("entries");
  });

  it("handles not-readable when access R_OK throws and emits not_readable event", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));
    await fs.promises.writeFile(path.join(tempDir, "file.txt"), "hello");

    const originalAccess = fs.promises.access;
    vi.spyOn(fs.promises, "access").mockImplementation((p: any, mode: any) => {
      if (mode === fs.constants.R_OK) {
        return Promise.reject(Object.assign(new Error("not readable"), { code: "EACCES" }));
      }
      return originalAccess(p, mode);
    });

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.readable).toBe(false);

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const notReadableCall = calls.find((c: any) => c.event_type === "workspace.mount.not_readable");
    expect(notReadableCall).toBeTruthy();
    expect(notReadableCall.message).toContain(tempDir);
  });

  it("emits writable event when write succeeds", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.writable).toBe(true);

    const calls = (fakeEventBus.emitLog as any).mock.calls.map((c: any[]) => c[0]);
    const writableCall = calls.find((c: any) => c.event_type === "workspace.mount.writable");
    expect(writableCall).toBeTruthy();
    expect(writableCall.message).toContain("writable");
  });

  it("cleans up temporary file after a successful write check", async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "workspace-guard-"));

    const fakeEventBus = { emitLog: vi.fn() };
    const status = await checkWorkspaceMount(tempDir, fakeEventBus as any);

    expect(status.exists).toBe(true);
    expect(status.writable).toBe(true);

    // Ensure no temp file with the copilot prefix remains
    const files = await fs.promises.readdir(tempDir);
    const leftover = files.find((f: string) => f.startsWith(".copilot-mount-test-"));
    expect(leftover).toBeUndefined();
  });
});
