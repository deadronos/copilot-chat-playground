# DES005 - Milestone D: Safety Toggles & UX Polish

**Status:** Completed  
**Date:** 2026-01-23  
**Related Task:** TASK005

## Overview

Design and implementation of safety features and UX polish for the Copilot Chat Playground, focusing on making the tool safer, more usable, and user-friendly through mode-based guardrails and enhanced interaction patterns.

## Goals

1. Provide users with clear safety modes to control AI capabilities
2. Improve user experience with better feedback and output management
3. Implement safe-by-default behavior
4. Add transparency features (token counting, status indicators)
5. Enhance error handling with actionable guidance

## Architecture

### Mode System

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend UI                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Mode Selector Dropdown                                │  │
│  │  • Explain-only (default) 🛡️                         │  │
│  │  • Project Helper 🔧                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│  POST /api/chat                                             │
│  Body: { prompt: string, mode?: ChatMode }                  │
│                                                             │
│  Validation: Zod schema with enum                           │
│  Default: "explain-only"                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Copilot Service                           │
│  Generates system prompt based on mode:                     │
│                                                             │
│  explain-only:                                              │
│  "Focus on explaining concepts. Do not execute             │
│   commands or make changes to files."                       │
│                                                             │
│  project-helper:                                            │
│  "You can help with code, execute commands,                │
│   and interact with project files."                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Copilot SDK                              │
│  Session created with systemMessage parameter               │
│  AI respects mode constraints in responses                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```typescript
// Frontend
const [mode, setMode] = useState<ChatMode>("explain-only");

// Sent to backend
fetch("/api/chat", {
  body: JSON.stringify({ prompt, mode })
});

// Backend validation
const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

// Copilot service system prompt generation
let systemPrompt = "";
if (mode === "explain-only") {
  systemPrompt = "You are in explain-only mode...";
} else if (mode === "project-helper") {
  systemPrompt = "You are in project-helper mode...";
}

// SDK session creation
await client.createSession({
  model: "gpt-4o",
  streaming: true,
  systemMessage: systemPrompt,
});
```

## Component Design

### Mode Selector

**Location:** Prompt Studio card, above prompt input  
**Component:** shadcn/ui Select (Radix UI based)  
**State:** Local component state, synced to backend on submission

**Visual Design:**
- Icon + Label format for clarity
- Description text below selector
- Distinct icons for each mode (Shield vs Wrench)
- Maintains design system consistency

**Modes:**

| Mode | Icon | Label | Description | Default |
|------|------|-------|-------------|---------|
| explain-only | 🛡️ ShieldCheckIcon | Explain-only | Safe mode. Explains concepts without executing code or making changes. | ✓ |
| project-helper | 🔧 WrenchIcon | Project Helper | Full access. Can execute commands and interact with project files. | |

### Output Actions

**Copy Button:**
- Uses Clipboard API
- Shows "Copied!" feedback for 2 seconds
- Graceful error handling

**Export Button:**
- Creates Blob with text content
- Downloads as `copilot-output-{timestamp}.txt`
- Uses browser download mechanism

**Clear Button:**
- Resets output and error state
- Returns to empty state

### Token Counter

**Display:** Small badge next to character count  
**Calculation:** `Math.ceil(output.length / 4)`  
**Format:** "~{count} tokens"  
**Purpose:** Give users rough estimate of API usage

### Enhanced Error Messages

**Structure:**
```
┌──────────────────────────────────────────────┐
│ Error                                        │
│ {error message}                              │
│                                              │
│ {actionable troubleshooting hint}            │
└──────────────────────────────────────────────┘
```

**Example:**
```
Error
Failed to connect to backend service.

Please check your connection and try again. If the problem 
persists, verify that the backend service is running.
```

## Type Definitions

```typescript
// Shared types
type ChatMode = "explain-only" | "project-helper";

// Frontend
const MODE_META: Record<
  ChatMode,
  { label: string; description: string; icon: typeof ShieldCheckIcon }
> = {
  "explain-only": {
    label: "Explain-only",
    description: "Safe mode. Explains concepts without executing code or making changes.",
    icon: ShieldCheckIcon,
  },
  "project-helper": {
    label: "Project Helper",
    description: "Full access. Can execute commands and interact with project files.",
    icon: WrenchIcon,
  },
};

// Backend
const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});
```

## Security Considerations

### Safe-by-Default
- `explain-only` is the default mode
- Requires explicit user action to switch to `project-helper`
- Backend validates mode on every request

### System Prompt Guardrails
- Mode-specific instructions to AI
- Explain-only mode restricts capabilities at AI level
- Not cryptographically secure (AI may still deviate)
- Provides reasonable safety layer for normal use

### Future Enhancements
- Add explicit tool restrictions in project-helper mode
- Implement request rate limiting per mode
- Add audit logging for mode usage
- Consider time-based mode reversion (auto-reset to explain-only)

## UX Patterns

### Loading States

Button text progression:
1. Default: "Send prompt"
2. Connecting: "Connecting..."
3. Streaming: "Streaming..."
4. Complete: "Send prompt" (enabled again)

### Status Indicator

Existing status badge enhanced with mode-aware messaging:
- Shows current streaming state
- Updates helper text based on context
- Visual pulse animation during streaming

### Information Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Prompt Studio                                           │
│                                                         │
│ Safety Mode           [Explain-only ▼]                 │
│ Description text here...                               │
│                                                         │
│ [Prompt input field]                                    │
│                                                         │
│ [Send prompt]         Helper text                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Stream Output                  [0 chars] [~0 tokens]    │
│                                                         │
│ [Output textarea]                                       │
│                                                         │
│ [Copy] [Export] [Clear]                                 │
└─────────────────────────────────────────────────────────┘
```

## Testing Strategy

### Integration Tests
- Mode parameter validation
- Default mode behavior
- Valid mode acceptance
- Invalid mode rejection

### Manual Testing
- Mode switching functionality
- Copy/export/clear actions
- Token count accuracy
- Error message display
- Loading state transitions

### Edge Cases
- Empty output (buttons disabled/hidden)
- Long outputs (token estimation)
- Network errors (error message quality)
- Invalid clipboard access (copy button fallback)

## Implementation Notes

### Frontend State Management
- Simple useState for mode (no global state needed)
- Mode and the latest chat timeline now persist locally and can be resumed after refresh (implemented later via `DES027`)
- Storage access is treated as best-effort; blocked/unavailable `localStorage` degrades gracefully instead of breaking the UI

### Token Estimation
- Current: Simple division (length / 4)
- Good enough for estimation
- Could enhance with tiktoken library for accuracy
- Consider adding warning if estimate exceeds limits

### Browser Compatibility
- Clipboard API requires HTTPS or localhost
- Blob download works in all modern browsers
- Select component is progressively enhanced

## Future Enhancements

1. **Multi-session Persistence**: Save more than one resumable chat session instead of only the latest session
2. **Mode History**: Track mode usage per session
3. **Advanced Modes**: Add more specialized modes (code-review, debug-only)
4. **Token Budgets**: Set per-mode token limits
5. **Export Formats**: Add JSON, Markdown export options
6. **Keyboard Shortcuts**: Add shortcuts for copy/clear
7. **Mode Indicator**: Add subtle mode indicator in output area
8. **Analytics**: Track mode usage and effectiveness

## Acceptance Criteria (Met)

✅ Mode selector visible and functional  
✅ Mode changes propagate to backend  
✅ Clear loading indicators  
✅ User-friendly error messages  
✅ Copy/export/clear buttons working  
✅ Token display implemented  
✅ Safety guidance present in UI  
✅ Tests added for validation  

## References

- Issue: Milestone D — Safety toggles & UX polish
- Related: idea.md (project milestones)
- Task: TASK005-milestone-d-safety-ux.md
- Commits: 1b1383d, 680566e, c9191a6, b63babe
