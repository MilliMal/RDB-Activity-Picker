import { cache } from "react"
import { readFileSync } from "fs"
import path from "path"
import type { ActivityCode } from "@/lib/types"

export const loadCodes = cache((): ActivityCode[] => {
  const filePath = path.join(process.cwd(), "lib/data/activities.json")
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as ActivityCode[]
})
