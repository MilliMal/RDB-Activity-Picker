import { loadSkills } from "./base"

// Builds the system prompt for /api/classify-intent.
// Gemini receives: personality + intent-gate skill only.
export function buildIntentGatePrompt(): string {
  return `
${loadSkills("personality", "intentGate")}

---

## Your task

Classify the user's input as "valid", "vague", or "unrelated".
Return a JSON object with:
  - type: one of "valid" | "vague" | "unrelated"
  - reason: one sentence explaining your classification

Respond only with the JSON object.
Do not include any text before or after it.
`.trim()
}
