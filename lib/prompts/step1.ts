import type { Section } from "@/lib/types"
import { loadSkills } from "./base"

// Builds the system prompt for /api/match-sections.
// Gemini receives: personality + section-match skill + live section list.
export function buildStep1Prompt(sections: Section[]): string {
  const sectionList = sections
    .map((s) => `  ${s.id} — ${s.title}`)
    .join("\n")

  return `
${loadSkills("personality", "sectionMatch")}

---

## Available sections

The following sections exist in the RDB activity code list.
Return only the section letters that apply to this business.

${sectionList}

---

## Your task

Return a JSON object with:
  - sections: an array of section letters e.g. ["A"] or ["G", "H"]

Rules:
  - Return between 1 and 3 letters. Fewer is better.
  - Only include a section if you are confident it applies.
  - Never return O, T, or U for a private business.
  - If section C (Manufacturing) applies, be certain — it has
    over 1,000 codes and will be passed in full to the next step.

Respond only with the JSON object.
Do not include any text before or after it.
`.trim()
}
