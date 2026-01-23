import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { EventBus } from "@copilot-playground/shared";

export type WorkspaceStatus = {
  exists: boolean;
  readable: boolean;
  writable: boolean;
  files?: string[];
};

/**
 * Performs a lightweight check to detect whether the given workspace path exists,
 * is readable, and whether the process can write to it. Emits logs via the
 * provided EventBus (if any).
 *
 * Note: Permission errors may be reported as either `EACCES` or `EPERM` on
 * different platforms; both are treated as indication that the workspace is
 * effectively read-only for our purposes.
 */
export async function checkWorkspaceMount(
  workspacePath = "/workspace",
  eventBus?: EventBus
): Promise<WorkspaceStatus> {
  const status: WorkspaceStatus = { exists: false, readable: false, writable: false };

  try {
    // Check existence
    await fs.promises.access(workspacePath, fs.constants.F_OK);
    status.exists = true;
  } catch (err) {
    eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "warn", component: "copilot", event_type: "workspace.mount.missing", message: `Workspace not found at ${workspacePath}` });
    return status;
  }

  // Check readability
  try {
    await fs.promises.access(workspacePath, fs.constants.R_OK);
    status.readable = true;
    try {
      // List files for visibility
      status.files = await fs.promises.readdir(workspacePath);
      eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "info", component: "copilot", event_type: "workspace.mount.visible", message: `Workspace visible at ${workspacePath} (${status.files.length} entries)` });
    } catch (e) {
      eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "info", component: "copilot", event_type: "workspace.mount.visible", message: `Workspace visible at ${workspacePath} (could not enumerate entries)` });
    }
  } catch (err) {
    eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "warn", component: "copilot", event_type: "workspace.mount.not_readable", message: `Workspace present but not readable at ${workspacePath}` });
  }

  // Check writability by attempting to write a temporary file.
  const tmpName = `.copilot-mount-test-${crypto.randomBytes(6).toString("hex")}`;
  const tmpPath = path.join(workspacePath, tmpName);
  try {
    await fs.promises.writeFile(tmpPath, "test");

    // Mark writable immediately after a successful write
    status.writable = true;
    eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "info", component: "copilot", event_type: "workspace.mount.writable", message: `Workspace is writable at ${workspacePath}` });

    // Attempt cleanup; failure here should not flip writable, but should be logged
    try {
      await fs.promises.rm(tmpPath, { force: true });
    } catch (cleanupErr: any) {
      eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "warn", component: "copilot", event_type: "workspace.mount.cleanup_error", message: `Workspace cleanup failed at ${workspacePath}: ${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)}` });
    }
  } catch (err: any) {
    // If the error indicates permission denied, consider read-only
    if (err && (err.code === "EACCES" || err.code === "EPERM")) {
      status.writable = false;
      eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "warn", component: "copilot", event_type: "workspace.mount.read_only", message: `Workspace appears read-only at ${workspacePath}` });
    } else {
      status.writable = false;
      eventBus?.emitLog({ timestamp: new Date().toISOString(), level: "warn", component: "copilot", event_type: "workspace.mount.write_error", message: `Workspace write check failed at ${workspacePath}: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  return status;
}
