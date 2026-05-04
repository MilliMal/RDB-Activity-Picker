/**
 * Normalizes model-returned section ids (trim, case, typos of letter form)
 * and intersects them with the canonical RDB section list.
 * If nothing survives, callers should fall back to the full section list so
 * code matching still has a corpus (see {@link resolveSectionIdsForMatching}).
 */
export function sanitizeSectionIds(
  raw: string[],
  allowedIds: readonly string[]
): string[] {
  const lowerToCanonical = new Map(
    allowedIds.map((id) => [id.toLowerCase(), id])
  )
  const out: string[] = []
  const seen = new Set<string>()

  for (const id of raw) {
    if (typeof id !== "string") continue
    const t = id.trim()
    if (!t) continue

    const byFull = lowerToCanonical.get(t.toLowerCase())
    if (byFull) {
      if (!seen.has(byFull)) {
        seen.add(byFull)
        out.push(byFull)
      }
      continue
    }

    if (t.length === 1) {
      const letter = t.toUpperCase()
      const canonical = lowerToCanonical.get(letter.toLowerCase())
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical)
        out.push(canonical)
      }
    }
  }

  return out
}

export function resolveSectionIdsForMatching(
  raw: string[],
  allSectionIds: readonly string[]
): string[] {
  const sanitized = sanitizeSectionIds(raw, allSectionIds)
  return sanitized.length > 0 ? sanitized : [...allSectionIds]
}
