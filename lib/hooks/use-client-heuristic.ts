const BUSINESS_NOUNS = [
  "sell", "sells", "selling", "sold", "vend", "vends",
  "buy", "buys", "buying", "shop", "store", "market",
  "farm", "grow", "grows", "growing", "produce", "manufacture",
  "service", "services", "offer", "provides", "run", "operate",
  "business", "company", "enterprise", "trade", "transport",
  "restaurant", "café", "hotel", "school", "clinic", "salon",
  "repair", "build", "construct", "import", "export", "distribute",
  "je vends", "je fais", "ndagurishya", "nkora",
]

export function useClientHeuristic() {
  function check(input: string): { passed: boolean; hint: string | null } {
    const trimmed = input.trim()

    if (!trimmed) {
      return { passed: false, hint: null }
    }

    if (trimmed.endsWith("?")) {
      return {
        passed: false,
        hint: "Try describing what your business does instead of asking a question.",
      }
    }

    const words = trimmed.split(/\s+/)
    const lower = trimmed.toLowerCase()
    const hasBusinessNoun = BUSINESS_NOUNS.some((noun) => lower.includes(noun))

    if (words.length < 3 && !hasBusinessNoun) {
      return {
        passed: false,
        hint: "Be more specific — include what you sell or do, and how you operate.",
      }
    }

    return { passed: true, hint: null }
  }

  return { check }
}
