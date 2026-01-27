import type { MatchSession, SnapshotPayload } from "../redvsblue-types.js";

const REHYDRATION_SNAPSHOT_LIMIT = 25;
export const STRATEGIC_SUMMARY_MAX_CHARS = 1200;

export function trimSummary(summary: string | null, maxChars: number): string | null {
  if (!summary) {
    return null;
  }
  if (summary.length <= maxChars) {
    return summary;
  }
  return summary.slice(summary.length - maxChars);
}

export function buildStrategicSummary(snapshots: SnapshotPayload[]): string {
  if (snapshots.length === 0) {
    return "";
  }
  const first = snapshots[0];
  const last = snapshots.at(-1) ?? first;
  const deltaRed = last.counts.red - first.counts.red;
  const deltaBlue = last.counts.blue - first.counts.blue;

  const eventCounts = new Map<string, number>();
  for (const snapshot of snapshots) {
    for (const event of snapshot.recentMajorEvents) {
      const key = event.type;
      eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1);
    }
  }
  const eventSummary = Array.from(eventCounts.entries())
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");

  return [
    `Summary over ${snapshots.length} snapshots.`,
    `Red ${first.counts.red}→${last.counts.red} (Δ${deltaRed}).`,
    `Blue ${first.counts.blue}→${last.counts.blue} (Δ${deltaBlue}).`,
    eventSummary ? `Events: ${eventSummary}.` : "No major events recorded.",
  ].join(" ");
}

export function mergeStrategicSummary(previous: string | null, next: string): string {
  const combined = [previous, next].filter(Boolean).join(" ");
  return trimSummary(combined, STRATEGIC_SUMMARY_MAX_CHARS) ?? "";
}

export function compactSessionSnapshots(session: MatchSession): void {
  const overflow = session.snapshots.length - REHYDRATION_SNAPSHOT_LIMIT;
  if (overflow <= 0) {
    return;
  }
  const summarized = session.snapshots.slice(0, overflow);
  const newSummary = buildStrategicSummary(summarized);
  session.strategicSummary = mergeStrategicSummary(session.strategicSummary, newSummary);
  session.snapshots = session.snapshots.slice(overflow);
  session.summaryUpdatedAt = Date.now();
  session.lastCompactionAt = Date.now();
}

export { REHYDRATION_SNAPSHOT_LIMIT };
