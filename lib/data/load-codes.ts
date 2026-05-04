import { cache } from "react"
import { readFileSync } from "fs"
import path from "path"
import type { ISICCode } from "@/lib/types"

export const loadCodes = cache((): ISICCode[] => {
  const filePath = path.join(process.cwd(), "lib/data/isic-codes.json")
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as ISICCode[]
})
