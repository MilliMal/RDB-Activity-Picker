export interface ActivityCode {
  code: string
  activity: string
  section: string
  sector: string
  division: string
}

export interface Section {
  id: string
  title: string
  divisions: string[]
}

export interface IntentResult {
  type: "valid" | "vague" | "unrelated"
  reason: string
}

export interface Step1Result {
  sections: string[]
}

export interface MatchedCode {
  code: string
  name: string
  reason: string
}

export interface ClarifyOption {
  label: string
  value: string
}

export interface Step2MatchResult {
  type: "match"
  /** Plain-language synthesis of the business before codes were chosen */
  businessUnderstanding: string
  codes: MatchedCode[]
}

export interface Step2ClarifyResult {
  type: "clarify"
  question: string
  options: ClarifyOption[]
}

export type Step2Result = Step2MatchResult | Step2ClarifyResult

export interface PickerEvent {
  event:
    | "intent-classified"
    | "sections-matched"
    | "codes-matched"
    | "clarify-loop"
    | "fallback-triggered"
    | "redirect-shown"
    | "edit-triggered"
    | "rdb-handoff"
  input: string
  result: Record<string, unknown>
  round?: number
  durationMs: number
}

export type FlowState =
  | { stage: "idle" }
  | { stage: "checking" }
  | { stage: "classifying" }
  | { stage: "early-clarify"; question: string; options: ClarifyOption[] }
  | { stage: "matching-sections" }
  | { stage: "matching-codes" }
  | {
      stage: "clarify"
      question: string
      options: ClarifyOption[]
      round: number
    }
  | { stage: "matched"; codes: MatchedCode[]; businessUnderstanding: string }
  | { stage: "redirect"; reason: string }
  | { stage: "fallback"; reason: "validation-error" | "max-rounds" }
  | { stage: "error"; message: string }
