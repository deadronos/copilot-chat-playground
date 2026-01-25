export type DecisionPromptRecord = {
  status: string
  requestId: string
  validatedDecision?: {
    params?: {
      team: string
      count: number
    }
  }
}

export type DecisionPromptSession = {
  effectiveRules: Record<string, unknown>
  effectiveConfig: Record<string, unknown>
  strategicSummary: string | null
  decisionHistory: DecisionPromptRecord[]
}

export type DecisionPromptSnapshot = {
  counts: { red: number; blue: number }
  gameSummary: { totalShips: number }
}

export type DecisionPromptOptions = {
  decisionTail?: number
}

export function buildDecisionPrompt(
  session: DecisionPromptSession,
  snapshot: DecisionPromptSnapshot,
  decisionRequestId: string,
  options: DecisionPromptOptions = {}
): string {
  const decisionTail = options.decisionTail ?? 5
  const red = snapshot.counts.red
  const blue = snapshot.counts.blue
  const leader = red === blue ? "even" : red > blue ? "red" : "blue"
  const imbalance = Math.abs(red - blue)
  const summary = session.strategicSummary
  const decisionSummary = session.decisionHistory
    .slice(-decisionTail)
    .map((record) => {
      const detail =
        record.validatedDecision?.params
          ? `${record.validatedDecision.params.team}:${record.validatedDecision.params.count}`
          : "n/a"
      return `${record.status} ${record.requestId} (${detail})`
    })
    .join("; ")

  const recentDecisions = decisionSummary.length === 0 ? "No recent decisions." : decisionSummary

  return [
    "You are the Red vs Blue AI Director.",
    "Return ONLY valid JSON that matches the schema below.",
    "Schema:",
    '{ "requestId": "<string>", "type": "spawnShips", "params": { "team": "red|blue", "count": <1-5> }, "confidence": <0-1 optional>, "reason": "<short text optional>" }',
    `requestId must equal: ${decisionRequestId}`,
    `Effective rules: ${JSON.stringify(session.effectiveRules)}.`,
    `Effective config: ${JSON.stringify(session.effectiveConfig)}.`,
    summary ? `Strategic summary: ${summary}` : "Strategic summary: (none yet).",
    `Recent decisions: ${recentDecisions}`,
    `Snapshot summary: red=${red}, blue=${blue}, total=${snapshot.gameSummary.totalShips}.`,
    `Balance status: leader=${leader}, imbalance=${imbalance}.`,
    "Choose a team that needs help and spawn 1-5 ships.",
  ].join("\n")
}
