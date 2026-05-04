import type { ISICCode } from "@/lib/types"

/**
 * Returns ISIC rows whose `section` is in `sectionIds`.
 * Deduplicates section ids. Empty `sectionIds` yields an empty list (no implicit “all codes”).
 */
export function filterCodesBySections(
  sectionIds: string[],
  allCodes: ISICCode[]
): ISICCode[] {
  if (sectionIds.length === 0) return []
  const allowed = new Set(sectionIds)
  return allCodes.filter((code) => allowed.has(code.section))
}
