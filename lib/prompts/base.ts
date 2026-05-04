import fs from "fs"
import path from "path"

const SKILLS_DIR = path.join(process.cwd(), "lib", "prompts", "skills")

// Registry of all available skills.
// Each prompt builder loads only what it needs — Gemini never
// receives all skills at once.
const Skills = {
  personality: "skill.personality.md",
  intentGate: "skill.intent-gate.md",
  sectionMatch: "skill.section-match.md",
  codeMatch: "skill.code-match.md",
  clarify: "skill.clarify.md",
} as const

// Loads one or more skills and joins them with a separator.
// The order of arguments determines the order Gemini sees them.
export function loadSkills(...names: (keyof typeof Skills)[]): string {
  return names
    .map((name) =>
      fs.readFileSync(path.join(SKILLS_DIR, Skills[name]), "utf-8")
    )
    .join("\n\n---\n\n")
}
