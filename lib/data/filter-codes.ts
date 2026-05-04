import type { ActivityCode } from "@/lib/types"

/**
 * Returns activity rows whose `section` is in `sectionIds`.
 * Deduplicates section ids. Empty `sectionIds` yields an empty list (no implicit “all codes”).
 */
export function filterCodesBySections(
  sectionIds: string[],
  allCodes: ActivityCode[]
): ActivityCode[] {
  if (sectionIds.length === 0) return []
  const allowed = new Set(sectionIds)
  return allCodes.filter((code) => allowed.has(code.section))
}
