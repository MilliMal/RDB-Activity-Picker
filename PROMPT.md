# RDB Activity Picker — modular architecture v3

Stack: Next.js 14 App Router · AI SDK (`ai` + `@ai-sdk/google`) · shadcn/ui · TanStack Table

Changes from v2: `input` / `startedAt` / `editMode` exposed from hook · `onError` on all `useObject` instances · pencil icon placement specified explicitly · `sectionIds` reset in `refineEarlyClarify` · analytics env vars removed · single env var

---

## Module map

```
lib/
├── types.ts                    ← Module 1: shared types
├── constants.ts                ← Module 1: shared constants
├── data/
│   ├── sections.json           ← static (21 ISIC sections)
│   ├── isic-codes.json         ← static (2,075 codes)
│   ├── load-sections.ts        ← Module 2: data loaders (cached)
│   ├── load-codes.ts           ← Module 2 (cached)
│   └── filter-codes.ts         ← Module 2: pure filter
├── schemas/
│   ├── intent-gate.ts          ← Module 3: Zod schemas
│   ├── step1.ts                ← Module 3
│   └── step2.ts                ← Module 3
├── prompts/
│   ├── skills/
│   │   ├── personality.md      ← voice, tone, EN/FR only
│   │   ├── intent-gate.md      ← classification rules
│   │   ├── section-match.md    ← 21 sections with Rwanda context
│   │   ├── code-match.md       ← code evaluation rules
│   │   └── clarify.md          ← clarification rules
│   ├── base.ts                 ← Module 4: skill registry + loadSkills()
│   ├── intent-gate.ts          ← Module 4: prompt builder
│   ├── step1.ts                ← Module 4: prompt builder
│   └── step2.ts                ← Module 4: prompt builder
├── analytics.ts                ← Module 5: event logging (NEW)
└── hooks/
    ├── use-client-heuristic.ts ← Module 6: client heuristic
    └── use-picker-flow.ts      ← Module 8: orchestrator

app/api/
├── classify-intent/route.ts    ← Module 7: API routes (streamObject)
├── match-sections/route.ts     ← Module 7
└── match-codes/route.ts        ← Module 7

components/
├── activity-input.tsx          ← Module 9: UI components
├── thinking-indicator.tsx      ← Module 9
├── clarify-card.tsx            ← Module 9
├── early-clarify-card.tsx      ← Module 9
├── match-results.tsx           ← Module 9 (includes RDB handoff)
├── activity-table.tsx          ← Module 9
├── redirect-message.tsx        ← Module 9
├── fallback-message.tsx        ← Module 9
└── retry-link.tsx              ← Module 9
```

---

## Module 1 — types and constants

**No dependencies. Build first.**

### `lib/types.ts`

```
ISICCode {
  code: string          // "01110"
  description: string
  section: string       // "A"
  division: string      // "01"
  group: string         // "011"
  class: string         // "0111"
}

Section {
  id: string            // "A"
  title: string
  divisions: string[]
}

IntentResult {
  type: "valid" | "vague" | "unrelated"
  reason: string
}

Step1Result {
  sections: string[]    // matched section IDs e.g. ["A", "C"]
}

MatchedCode {
  code: string
  name: string
  reason: string
}

ClarifyOption {
  label: string         // plain-language description shown to user
  value: string         // internal identifier for re-submission
}

Step2MatchResult {
  type: "match"
  codes: MatchedCode[]
}

Step2ClarifyResult {
  type: "clarify"
  question: string
  options: ClarifyOption[]
}

Step2Result = Step2MatchResult | Step2ClarifyResult

PickerEvent {            // NEW — for analytics
  event: "intent-classified" | "sections-matched" | "codes-matched"
       | "clarify-loop" | "fallback-triggered" | "redirect-shown"
       | "edit-triggered" | "rdb-handoff"
  input: string
  result: Record<string, unknown>
  round?: number
  durationMs: number
}

FlowState =
  | { stage: "idle" }
  | { stage: "checking" }
  | { stage: "classifying" }
  | { stage: "early-clarify"; question: string; options: ClarifyOption[] }
  | { stage: "matching-sections" }
  | { stage: "matching-codes" }
  | { stage: "clarify"; question: string; options: ClarifyOption[]; round: number }
  | { stage: "matched"; codes: MatchedCode[] }
  | { stage: "redirect"; reason: string }
  | { stage: "fallback"; reason: "validation-error" | "max-rounds" }
  | { stage: "error"; message: string }
```

### `lib/constants.ts`

```
MAX_CLARIFY_ROUNDS = 3
MODEL = "gemini-2.0-flash"    // fast, strong structured output
RDB_PORTAL_URL = "https://www.rdb.rw/rdb/single-project-certification/"
SUPPORTED_LANGUAGES = ["en", "fr", "rw"]   // English, French, Kinyarwanda
```

---

## Module 2 — data loaders

**Depends on: Module 1. FIX: wrapped with React `cache()` so each file is read once per server lifecycle, not once per request.**

### `lib/data/load-sections.ts`

```
import { cache } from 'react'

loadSections: cache((): Section[] => {
  // Read sections.json synchronously.
  // cache() ensures this runs once and memoizes across requests
  // in the same render cycle (or server component tree).
})
```

### `lib/data/load-codes.ts`

```
import { cache } from 'react'

loadCodes: cache((): ISICCode[] => {
  // Read isic-codes.json synchronously.
  // Same cache() wrapping — critical since this is 2,075 entries
  // and gets called by both the API routes and the table.
})
```

### `lib/data/filter-codes.ts`

```
filterCodesBySections(
  sectionIds: string[],
  allCodes: ISICCode[]
): ISICCode[]

Pure filter. No cache needed — it's just an array operation.

Example:
  filterCodesBySections(["A", "C"], allCodes) → ~180 codes
```

---

## Module 3 — Zod schemas

**Depends on: Module 1. Unchanged from v1 — documented here for completeness.**

### `lib/schemas/intent-gate.ts`

```
intentGateSchema = z.object({
  type: z.enum(["valid", "vague", "unrelated"]),
  reason: z.string()
})

Failure: treat as "valid" — let the pipeline try.
```

### `lib/schemas/step1.ts`

```
step1Schema = z.object({
  sections: z.array(z.string()).min(1).max(5)
})

Failure: return all section IDs — no filtering, pipeline continues.
```

### `lib/schemas/step2.ts`

```
step2Schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("match"),
    codes: z.array(z.object({
      code: z.string(),
      name: z.string(),
      reason: z.string()
    })).min(1).max(5)
  }),
  z.object({
    type: z.literal("clarify"),
    question: z.string(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string()
    })).min(2).max(4)
  })
])

Failure: return { type: "fallback" } — orchestrator sends user to table.
```

---

## Module 4 — system prompts

**Depends on: skills folder. No AI calls. Pure string assembly.**

Language support: English and French only. The personality skill
detects the user's language and instructs Gemini to respond in kind.

### File structure

```
lib/prompts/
├── skills/
│   ├── personality.md    ← voice, tone, language rules (EN/FR)
│   ├── intent-gate.md    ← classification rules and examples
│   ├── section-match.md  ← all 21 sections with Rwanda context
│   ├── code-match.md     ← how to evaluate and pick codes
│   └── clarify.md        ← when and how to ask questions
├── base.ts               ← skill registry and loadSkills()
├── intent-gate.ts        ← prompt builder for /api/classify-intent
├── step1.ts              ← prompt builder for /api/match-sections
└── step2.ts              ← prompt builder for /api/match-codes
```

### `lib/prompts/base.ts`

```
Skills registry — maps short keys to filenames in skills/.
All prompt builders import from here. Never import skill files directly.

export const Skills = {
  personality:  'personality.md',
  intentGate:   'intent-gate.md',
  sectionMatch: 'section-match.md',
  codeMatch:    'code-match.md',
  clarify:      'clarify.md',
}

loadSkills(...names: (keyof typeof Skills)[]): string
  Reads each named skill from lib/prompts/skills/ using fs.readFileSync.
  Joins them with a '---' separator in the order provided.
  Returns the assembled string — this becomes the system prompt body.
```

### `lib/prompts/intent-gate.ts`

```
buildIntentGatePrompt(): string

Skills loaded (in order):
  1. personality   ← voice, tone, EN/FR language detection
  2. intentGate    ← valid/vague/unrelated rules and examples

Appended after skills:
  ## Your task
  Instructs Gemini to return JSON: { type, reason }
  type is one of "valid" | "vague" | "unrelated"
  reason is one sentence.

Gemini never sees: sectionMatch, codeMatch, clarify
```

### `lib/prompts/step1.ts`

```
buildStep1Prompt(sections: Section[]): string

Argument:
  sections — array of { section: string, sector: string }
             loaded from sectors.json by the API route

Skills loaded (in order):
  1. personality    ← voice, tone, EN/FR language detection
  2. sectionMatch   ← section guide with Rwanda context

Injected dynamically:
  ## Available sections
  The 21 sections formatted as "  A — Agriculture, Forestry and Fishing"
  one per line — Gemini picks from exactly this list.

Appended after skills + sections:
  ## Your task
  Return JSON: { sections: string[] }
  1–3 letters. Includes the C-has-1062-codes warning.

Gemini never sees: intentGate, codeMatch, clarify
```

### `lib/prompts/step2.ts`

```
buildStep2Prompt(
  filteredCodes: ActivityCode[],
  clarifyHistory: { question: string; answer: string }[]
): string

Arguments:
  filteredCodes   — pre-filtered subset from activities.json
                    shape: { code, activity, section, sector, division }
  clarifyHistory  — array of previous Q&A turns, empty on first call

Skills loaded (in order):
  1. personality  ← voice, tone, EN/FR language detection
  2. codeMatch    ← how to evaluate codes and write reasons
  3. clarify      ← when and how to ask clarification questions

Injected dynamically:
  ## Activity codes to evaluate
  Each code formatted as "  [12345] Activity Name (Division Name)"
  Includes the count so Gemini knows the size of the list.

  ## Clarification history  ← only appended when clarifyHistory.length > 0
  Previous rounds formatted as "Round N:\n  Q: ...\n  A: ..."

Appended last:
  ## Your task
  Shows Gemini both valid JSON shapes in full:
    Shape 1: { type: "match", codes: [{ code, name, reason }] }
    Shape 2: { type: "clarify", question, options: [{ label, value }] }
  Rules: 1–5 codes, 2–4 options, no "Other" option (UI adds it),
  respond only with JSON.

Gemini never sees: intentGate, sectionMatch
```

---

## Module 5 — analytics

**NEW module. Depends on: Module 1 (PickerEvent type). No AI, no UI. Each API route calls one function.**

### `lib/analytics.ts`

```
logPickerEvent(event: PickerEvent): void

Logs a structured event. The destination is configurable at
build time via ANALYTICS_PROVIDER env var:

  "console"  → JSON.stringify to console.log (default for dev)
  "vercel"   → Vercel Analytics custom event
  "posthog"  → PostHog capture (if POSTHOG_KEY is set)

The function is fire-and-forget — it never throws, never awaits.
A failure in analytics must never block the pipeline.

Events to log (called from API routes):
  intent-classified  → { type, reason, durationMs }
  sections-matched   → { sections[], durationMs }
  codes-matched      → { type, codes[]|question, round, durationMs }
  fallback-triggered → { reason, round, durationMs }
  redirect-shown     → { reason, durationMs }
  edit-triggered     → { previousStage, durationMs }   (from orchestrator)
  rdb-handoff        → { codes[], durationMs }          (from orchestrator)

durationMs = Date.now() at call time minus the request start timestamp
passed in from the orchestrator via the request body.
```

---

## Module 6 — client hook

**Depends on: Module 1. No AI calls.**

### `lib/hooks/use-client-heuristic.ts`

```
useClientHeuristic(): {
  check: (input: string) => { passed: boolean; hint: string | null }
}

Rules (no API call):
  1. Ends with "?"       → hint: "Try describing what your business does
                           instead of asking a question."
  2. Under 3 words, no
     business nouns      → hint: "Be more specific — include what you
                           sell or do, and how you operate."
  3. Empty / whitespace  → passed: false, hint: null (silent block)
  4. Otherwise           → passed: true, hint: null
```

---

## Module 7 — API routes

**FIX: routes now use `streamObject` instead of `generateObject`, enabling the "Thought for N seconds" streaming display. Each route accepts a `startedAt` timestamp from the client for accurate duration logging.**

### Provider setup (shared, not a separate file)

```typescript
import { google } from '@ai-sdk/google'
const model = google(MODEL)   // "gemini-2.0-flash"
```

### `app/api/classify-intent/route.ts`

```
POST /api/classify-intent
Body: { input: string; startedAt: number }

Implementation:
  1. Build prompt: buildIntentGatePrompt()
  2. const result = streamObject({
       model,
       schema: intentGateSchema,
       system: buildIntentGatePrompt(),
       prompt: input
     })
  3. Return result.toTextStreamResponse()
     (AI SDK streams partial JSON as the model generates)
  4. On completion, call logPickerEvent("intent-classified", ...)

Client reads this stream via useObject (see orchestrator).

Fallback: if the stream errors or schema parse fails,
  return { type: "valid", reason: "gate-fallback" }
  as a plain JSON response (not streamed).
```

### `app/api/match-sections/route.ts`

```
POST /api/match-sections
Body: { input: string; startedAt: number }

Implementation:
  1. const sections = loadSections()     // cached
  2. streamObject with step1Schema + buildStep1Prompt(sections)
  3. Return toTextStreamResponse()
  4. Log "sections-matched"

Fallback: return { sections: allSectionIds }
```

### `app/api/match-codes/route.ts`

```
POST /api/match-codes
Body: {
  input: string
  sectionIds: string[]
  clarifyHistory: { question: string; answer: string }[]
  round: number
  startedAt: number
}

Implementation:
  1. const allCodes = loadCodes()        // cached
  2. const filtered = filterCodesBySections(sectionIds, allCodes)
  3. streamObject with step2Schema + buildStep2Prompt(filtered, clarifyHistory)
  4. Return toTextStreamResponse()
  5. Log "codes-matched" or "fallback-triggered"

Fallback: return { type: "fallback" } as plain JSON.
```

---

## Module 8 — orchestrator hook

**FIX: uses `useObject` from `ai/react` for each streaming AI call. FIX: adds `edit` action. Depends on: Modules 1, 6.**

### `lib/hooks/use-picker-flow.ts`

```typescript
// Three useObject instances — one per AI step.
// Each is idle until the orchestrator explicitly submits to it.

const intentGate = useObject({
  api: '/api/classify-intent',
  schema: intentGateSchema,
  onFinish: handleIntentResult,
  onError: () => setState({ stage: 'error', message: 'intent-gate-failed' })  // FIX
})

const sectionMatcher = useObject({
  api: '/api/match-sections',
  schema: step1Schema,
  onFinish: handleSectionResult,
  onError: () => setState({ stage: 'error', message: 'section-match-failed' }) // FIX
})

const codeMatcher = useObject({
  api: '/api/match-codes',
  schema: step2Schema,
  onFinish: handleCodeResult,
  onError: () => setState({ stage: 'fallback', reason: 'validation-error' })   // FIX — code errors go to table, not hard error
})
```

**Exposed actions:**

```
usePickerFlow(): {
  state: FlowState
  isStreaming: boolean           // true while any useObject is loading
  input: string                  // FIX — current input text, needed by page for defaultValue
  startedAt: number | null       // FIX — timestamp of current request, needed by ThinkingIndicator
  editMode: boolean              // FIX — true between edit() call and next submit(), re-enables ActivityInput
  submit: (input: string) => void
  selectClarifyOption: (value: string) => void
  submitCustomClarify: (text: string) => void
  refineEarlyClarify: (text: string) => void
  edit: () => void
  retry: () => void
  handleRdbHandoff: () => void
}
```

**`submit(input)`:**

```
1. Set state → "checking"

2. CLIENT HEURISTIC
   const { passed, hint } = check(input)
   If not passed:
     If hint → surface hint via component prop (no state change needed)
     Set state → "idle"
     Return

3. Set state → "classifying"
   intentGate.submit({ input, startedAt: Date.now() })
   → onFinish triggers handleIntentResult
```

**`handleIntentResult(result)`:**

```
If result.type === "unrelated":
  Set state → { stage: "redirect", reason: result.reason }
  Return

If result.type === "vague":
  Set state → { stage: "early-clarify", ... }
  Return

If result.type === "valid":
  Set state → "matching-sections"
  sectionMatcher.submit({ input, startedAt: Date.now() })
  → onFinish triggers handleSectionResult
```

**`handleSectionResult(result)`:**

```
Store sectionIds = result.sections
Set state → "matching-codes"
codeMatcher.submit({
  input,
  sectionIds,
  clarifyHistory: [],
  round: 0,
  startedAt: Date.now()
})
→ onFinish triggers handleCodeResult
```

**`handleCodeResult(result)`:**

```
If result.type === "fallback":
  Set state → { stage: "fallback", reason: "validation-error" }
  Return

If result.type === "match":
  Set state → { stage: "matched", codes: result.codes }
  Return

If result.type === "clarify":
  Set clarifyRound += 1
  If clarifyRound > MAX_CLARIFY_ROUNDS:
    Set state → { stage: "fallback", reason: "max-rounds" }
    Return
  Set state → { stage: "clarify", question, options, round: clarifyRound }
```

**`selectClarifyOption(value)` / `submitCustomClarify(text)`:**

```
Push { question: currentQuestion, answer: value/text } to clarifyHistory
Set state → "matching-codes"
codeMatcher.submit({
  input,
  sectionIds,           // same — no re-filtering
  clarifyHistory,       // now includes the new answer
  round: clarifyRound,
  startedAt: Date.now()
})
```

**`refineEarlyClarify(text)`:**

```
Replace input with text
Reset clarifyHistory, clarifyRound
Reset sectionIds to []            // FIX — prevents stale sectionIds from a
                                  // previous run bleeding into the new pipeline
                                  // if Step 1 fails and falls back to all sections
Set state → "classifying"
intentGate.submit({ input: text, startedAt: Date.now() })
// Re-enters from the intent gate. If still vague, early-clarify
// shows again. If now valid, pipeline continues.
```

**`edit()` — NEW:**

```
// The user clicked the pencil icon on their input bubble.
// Does NOT reset to idle — keeps their input text pre-filled.

logPickerEvent("edit-triggered", { previousStage: state.stage })
Reset clarifyHistory, clarifyRound, sectionIds
Set editMode = true           // signals activity-input to re-enable
Set state → "idle"
// On next submit(), the pipeline restarts from the intent gate
// with whatever the user types (pre-filled with the previous input).
```

**`handleRdbHandoff()` — NEW:**

```
// Called when user clicks "Register with these codes"
logPickerEvent("rdb-handoff", { codes: state.codes })
// Open RDB portal. See match-results component for the CTA.
```

**`retry()`:**

```
Clear all state (input, sectionIds, clarifyHistory, clarifyRound)
Set state → "idle"
```

**`isStreaming`:**

```
= intentGate.isLoading || sectionMatcher.isLoading || codeMatcher.isLoading

Passed to ThinkingIndicator and used to disable ActivityInput.
```

---

## Module 9 — UI components

**Depends on: Module 1. All shadcn/ui. No component calls APIs or contains pipeline logic.**

### `components/activity-input.tsx`

```
Props:
  onSubmit: (input: string) => void
  disabled: boolean
  hint: string | null
  defaultValue: string          // NEW — pre-fills input on edit()
  placeholder: string

Renders:
  shadcn Input + send button.
  If hint is not null, show as helper text below input.
  Disables while disabled=true (pipeline running).
  Pre-fills with defaultValue when entering edit mode.
```

### `components/thinking-indicator.tsx`

```
Props:
  isStreaming: boolean
  startedAt: number | null

Renders:
  "Thinking..." while isStreaming is true.
  "Thought for N seconds" with chevron toggle after streaming ends.
  Timer derived from startedAt — counts up in real time while streaming,
  then freezes at final duration.
  Collapsible reasoning content area (the grey box from your screens).
```

### `components/clarify-card.tsx`

```
Props:
  question: string
  options: ClarifyOption[]
  onSelect: (value: string) => void
  onCustom: (text: string) => void
  round: number
  maxRounds: number

Renders:
  Selectable option cards (shadcn Card).
  "Other" → expands to text input (the Follow-up screen).
  Progress indicator if round > 1: "Clarification 2 of 3".
```

### `components/early-clarify-card.tsx`

```
Props:
  reason: string
  onRefine: (text: string) => void

Renders:
  Simpler than clarify-card — no multiple-choice.
  Reason text + single text input for the refined description.
  Calls onRefine on submit → re-enters intent gate.
```

### `components/match-results.tsx`

```
Props:
  codes: MatchedCode[]
  onBrowseTable: () => void
  onRegister: () => void        // NEW — RDB handoff

Renders:
  Matched code cards (code badge + name + reason).
  "Not your activity? Browse full activity table" link.
  NEW: "Register with these codes →" CTA button at the bottom.
    Clicking: copies codes to clipboard AND opens RDB_PORTAL_URL.
    Button text updates to "Codes copied!" for 2 seconds after click.
    Calls onRegister() prop so the orchestrator can log the event.
```

### `components/activity-table.tsx`

```
Props:
  data: ISICCode[]              // full 2,075 rows — always loaded
  highlightedCodes: string[]    // from matched codes only

Renders:
  TanStack Table with row virtualisation.
  Columns: Code · Description · Section · Division.
  Client-side text search and column sorting.
  Highlighted rows scroll into view when highlightedCodes changes.
  "Browse full activity table" header with count badge.
```

### `components/redirect-message.tsx`

```
Props:
  reason: string
  onRetry: () => void

Renders:
  Friendly redirect when intent gate returns "unrelated".
  Three example prompts the user can tap to auto-fill the input.
```

### `components/fallback-message.tsx`

```
Props:
  reason: "validation-error" | "max-rounds"
  onBrowseTable: () => void
  onRetry: () => void

Renders:
  "validation-error" → "We couldn't match your business. Browse
    the full table or try a different description."
  "max-rounds"       → "After a few clarifications we still
    couldn't narrow it down. Browse the full table."
  Two buttons: Browse table · Try again.
```

### `components/retry-link.tsx`

```
Props:
  onRetry: () => void

Renders:
  "Not sure about the answer? Retry here!"
```

---

## Assembly — page component

### `app/page.tsx`

```
Server component loads codes once (cached):
  const allCodes = loadCodes()   // cache() ensures single read

Client component uses orchestrator:
  const {
    state, isStreaming,
    submit, selectClarifyOption, submitCustomClarify,
    refineEarlyClarify, edit, retry, handleRdbHandoff
  } = usePickerFlow()

Render map:

  idle / checking / classifying / matching-*:
    <ActivityInput onSubmit={submit} disabled={isStreaming} />
    {isStreaming && <ThinkingIndicator isStreaming startedAt={...} />}

  early-clarify:
    <ActivityInput disabled />
    <EarlyClarifyCard reason={state.question} onRefine={refineEarlyClarify} />

  clarify:
    <ActivityInput disabled />
    <ClarifyCard
      question={state.question}
      options={state.options}
      round={state.round}
      maxRounds={MAX_CLARIFY_ROUNDS}
      onSelect={selectClarifyOption}
      onCustom={submitCustomClarify}
    />

  matched:
    // FIX — pencil icon sits OUTSIDE and to the RIGHT of the input bubble,
    // as a sibling element, not inside ActivityInput. It is rendered by
    // the page directly, not by ActivityInput. Clicking it calls edit().
    <div className="flex items-center gap-2">
      <InputBubble value={input} />         // read-only display of submitted input
      <PencilIcon onClick={edit} />         // shadcn Button variant="ghost" size="icon"
    </div>
    <MatchResults
      codes={state.codes}
      onBrowseTable={scrollToTable}
      onRegister={handleRdbHandoff}
    />
    <RetryLink onRetry={retry} />

  redirect:
    <RedirectMessage reason={state.reason} onRetry={retry} />

  fallback:
    <FallbackMessage
      reason={state.reason}
      onBrowseTable={scrollToTable}
      onRetry={retry}
    />

  error:
    <FallbackMessage reason="validation-error" onRetry={retry} />

  Always rendered (independent of pipeline state):
    <ActivityTable
      data={allCodes}
      highlightedCodes={
        state.stage === "matched"
          ? state.codes.map(c => c.code)
          : []
      }
    />
```

---

## Build order and parallelism

```
Phase 1 — no dependencies, build in parallel:
  ├── Module 1: types.ts, constants.ts
  ├── Module 5: analytics.ts (only needs PickerEvent type)
  ├── Data files: sections.json, isic-codes.json (verify structure)
  └── Module 9 (partial): activity-table.tsx (only needs ISICCode type)

Phase 2 — depends on Module 1:
  ├── Module 2: cached data loaders + filter function
  ├── Module 3: Zod schemas
  ├── Module 6: client heuristic hook
  └── Module 9 (remaining): all other UI components

Phase 3 — depends on Modules 1–3:
  ├── Module 4: system prompts (multilingual)
  └── Module 7: API routes (streamObject + Google provider)

Phase 4 — depends on everything:
  ├── Module 8: orchestrator hook (useObject)
  └── Assembly: page.tsx
```

---

## Error handling summary

| Failure | Where caught | Result |
|---|---|---|
| Network error | API route try/catch | `{ stage: "error" }` |
| Intent gate schema fail | API route | Treat as `"valid"` — continue |
| Step 1 schema fail | API route | Return all section IDs — continue |
| Step 2 schema fail | API route | `{ type: "fallback" }` → table |
| Max clarify rounds | Orchestrator | `{ stage: "fallback", reason: "max-rounds" }` |
| Google API timeout | API route try/catch | `{ stage: "error" }` |
| Analytics failure | `logPickerEvent` try/catch | Silent — never blocks pipeline |
| RDB portal unreachable | Browser (not our concern) | Codes copied to clipboard as backup |

**Principle:** fail forward at the gate and Step 1. Fail to the table at Step 2. Never crash silently.

---

## Environment variables

```
GOOGLE_GENERATIVE_AI_API_KEY=   ← required, Google AI Studio key
```
