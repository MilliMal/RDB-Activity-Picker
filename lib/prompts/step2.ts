import type { ActivityCode } from "@/lib/types"
import { loadSkills } from "./base"

interface ClarifyTurn {
  question: string
  answer: string
}

// Builds the system prompt for /api/match-codes.
// Gemini receives: personality + code-match skill + clarify skill
// + filtered code list + clarification history (if any).
export function buildStep2Prompt(
  filteredCodes: ActivityCode[],
  clarifyHistory: ClarifyTurn[]
): string {
  const codeList = filteredCodes
    .map(
      (c) =>
        `  [${c.code}] ${c.activity} (division: ${c.division}; sector: ${c.sector}; section: ${c.section})`
    )
    .join("\n")

  const historyBlock =
    clarifyHistory.length > 0
      ? `## Clarification history

The user has already answered these questions.
Do not ask about any topic already covered below.

${clarifyHistory
  .map(
    (turn, i) => `Round ${i + 1}:\n  Q: ${turn.question}\n  A: ${turn.answer}`
  )
  .join("\n\n")}`
      : ""

  return `
${loadSkills("personality", "codeMatch", "clarify")}

---

## Activity codes to evaluate

The following ${filteredCodes.length} codes have been pre-filtered
to the sections most relevant to this business.
Evaluate only these codes — do not reference codes outside this list.

${codeList}

${historyBlock ? `\n---\n\n${historyBlock}` : ""}

---

## Your task

Return a JSON object in one of these two shapes:

Shape 1 — when you can confidently match:
  {
    "type": "match",
    "businessUnderstanding": "2–4 sentences in plain language: what kind of business this is, how it operates, primary vs secondary activities, and whether you infer one operation or multiple distinct lines. Must reflect your reasoning BEFORE picking codes — not a summary of the codes themselves.",
    "codes": [
      {
        "code": "12345",
        "name": "Plain-language activity name",
        "reason": "One or two sentences explaining why this fits."
      }
    ]
  }
  The field businessUnderstanding is required for every match.
  Return one code per distinct business activity or operation.
  Do not pad — only include a code if it clearly matches that
  understanding.

Shape 2 — when you need more information:
  {
    "type": "clarify",
    "question": "One direct question in the user's language.",
    "options": [
      { "label": "Plain-language option", "value": "option-1" },
      { "label": "Plain-language option", "value": "option-2" }
    ]
  }
  Return 2 to 4 options. Do not include an "Other" option —
  the UI adds that automatically.

Return only one shape. Never return both.
Respond only with the JSON object.
Do not include any text before or after it.
`.trim()
}
