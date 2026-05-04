import { cache } from "react"
import { readFileSync } from "fs"
import path from "path"
import type { Section } from "@/lib/types"

export const loadSections = cache((): Section[] => {
  const filePath = path.join(process.cwd(), "lib/data/sections.json")
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as Section[]
})
