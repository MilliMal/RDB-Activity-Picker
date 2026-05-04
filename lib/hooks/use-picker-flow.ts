"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import sectionsData from "@/lib/data/sections.json"
import { resolveSectionIdsForMatching } from "@/lib/data/resolve-section-ids"
import { intentGateSchema } from "@/lib/schemas/intent-gate"
import { step1Schema } from "@/lib/schemas/step1"
import { step2Schema } from "@/lib/schemas/step2"
import { useClientHeuristic } from "@/lib/hooks/use-client-heuristic"
import { logPickerEvent } from "@/lib/analytics"
import { MAX_CLARIFY_ROUNDS } from "@/lib/constants"
import type {
  ClarifyOption,
  FlowState,
  MatchedCode,
  Section,
} from "@/lib/types"

const ALL_SECTION_IDS = (sectionsData as Section[]).map((s) => s.id)

export function usePickerFlow() {
  const [state, setState] = useState<FlowState>({ stage: "idle" })
  const [inputValue, setInputValue] = useState("")
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [clarifyHistoryState, setClarifyHistoryState] = useState<
    { question: string; answer: string }[]
  >([])

  const lastPipelineStartedAtRef = useRef<number | null>(null)
  const matchedShownAtRef = useRef<number | null>(null)

  const pipelineStart = (ts: number) => {
    lastPipelineStartedAtRef.current = ts
    setStartedAt(ts)
  }

  const stateRef = useRef<FlowState>(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const sectionIds = useRef<string[]>([])
  const clarifyHistory = useRef<{ question: string; answer: string }[]>([])

  const syncClarifyHistory = () => {
    setClarifyHistoryState([...clarifyHistory.current])
  }
  const clarifyRound = useRef(0)
  const currentQuestion = useRef("")
  const currentInput = useRef("")

  const { check } = useClientHeuristic()

  const handleCodeResult = useCallback((result: unknown) => {
    const r = result as {
      type?: string
      codes?: MatchedCode[]
      question?: string
      options?: ClarifyOption[]
    } | null

    if (!r || r.type === "fallback") {
      matchedShownAtRef.current = null
      setState({ stage: "fallback", reason: "validation-error" })
      return
    }
    if (r.type === "match" && r.codes && r.codes.length > 0) {
      matchedShownAtRef.current = Date.now()
      setState({ stage: "matched", codes: r.codes })
      return
    }
    if (
      r.type === "clarify" &&
      r.question &&
      r.options &&
      r.options.length >= 2
    ) {
      matchedShownAtRef.current = null
      clarifyRound.current += 1
      if (clarifyRound.current > MAX_CLARIFY_ROUNDS) {
        setState({ stage: "fallback", reason: "max-rounds" })
        return
      }
      currentQuestion.current = r.question
      setState({
        stage: "clarify",
        question: r.question,
        options: r.options,
        round: clarifyRound.current,
      })
      return
    }
    matchedShownAtRef.current = null
    setState({ stage: "fallback", reason: "validation-error" })
  }, [])

  const codeMatcher = useObject({
    api: "/api/match-codes",
    schema: step2Schema,
    onFinish: ({ object, error }) => {
      if (error != null || object == null) {
        handleCodeResult({ type: "fallback" })
        return
      }
      handleCodeResult(object)
    },
    onError: () => {
      matchedShownAtRef.current = null
      setState({ stage: "fallback", reason: "validation-error" })
    },
  })

  const handleSectionResult = useCallback(
    (result: unknown) => {
      const r = result as { sections?: string[] } | null
      const rawIds = r?.sections?.length ? r.sections : ALL_SECTION_IDS
      sectionIds.current = resolveSectionIdsForMatching(rawIds, ALL_SECTION_IDS)
      setState({ stage: "matching-codes" })
      const ts = Date.now()
      pipelineStart(ts)
      codeMatcher.submit({
        input: currentInput.current,
        sectionIds: sectionIds.current,
        clarifyHistory: clarifyHistory.current,
        round: clarifyRound.current,
        startedAt: ts,
      })
    },
    [codeMatcher]
  )

  const sectionMatcher = useObject({
    api: "/api/match-sections",
    schema: step1Schema,
    onFinish: ({ object, error }) => {
      if (error != null || object == null) {
        handleSectionResult({ sections: ALL_SECTION_IDS })
        return
      }
      handleSectionResult(object)
    },
    onError: () => handleSectionResult({ sections: ALL_SECTION_IDS }),
  })

  const handleIntentResult = useCallback(
    (result: unknown) => {
      const r = result as { type?: string; reason?: string } | null

      if (!r) {
        matchedShownAtRef.current = null
        const ts = Date.now()
        setState({ stage: "matching-sections" })
        pipelineStart(ts)
        sectionMatcher.submit({ input: currentInput.current, startedAt: ts })
        return
      }

      if (r.type === "unrelated") {
        matchedShownAtRef.current = null
        setState({ stage: "redirect", reason: r.reason ?? "" })
        return
      }

      if (r.type === "vague") {
        matchedShownAtRef.current = null
        setState({
          stage: "early-clarify",
          question:
            "Could you describe what your business does in a little more detail?",
          options: [],
        })
        return
      }

      matchedShownAtRef.current = null
      const ts = Date.now()
      setState({ stage: "matching-sections" })
      pipelineStart(ts)
      sectionMatcher.submit({ input: currentInput.current, startedAt: ts })
    },
    [sectionMatcher]
  )

  const intentGate = useObject({
    api: "/api/classify-intent",
    schema: intentGateSchema,
    onFinish: ({ object, error }) => {
      if (error != null || object == null) {
        handleIntentResult(null)
        return
      }
      handleIntentResult(object)
    },
    onError: () => setState({ stage: "error", message: "intent-gate-failed" }),
  })

  const submit = useCallback(
    (input: string): { hint: string | null } => {
      setState({ stage: "checking" })
      const { passed, hint } = check(input)

      if (!passed) {
        setState({ stage: "idle" })
        return { hint }
      }

      currentInput.current = input
      setInputValue(input)
      setEditMode(false)
      matchedShownAtRef.current = null
      clarifyHistory.current = []
      clarifyRound.current = 0
      sectionIds.current = []
      setClarifyHistoryState([])

      setState({ stage: "classifying" })
      const ts = Date.now()
      pipelineStart(ts)
      intentGate.submit({ input, startedAt: ts })
      return { hint: null }
    },
    [check, intentGate]
  )

  const selectClarifyOption = useCallback(
    (option: ClarifyOption) => {
      clarifyHistory.current.push({
        question: currentQuestion.current,
        answer: option.label,
      })
      syncClarifyHistory()
      setState({ stage: "matching-codes" })
      const ts = Date.now()
      pipelineStart(ts)
      codeMatcher.submit({
        input: currentInput.current,
        sectionIds: sectionIds.current,
        clarifyHistory: clarifyHistory.current,
        round: clarifyRound.current,
        startedAt: ts,
      })
    },
    [codeMatcher]
  )

  const submitCustomClarify = useCallback(
    (text: string) => {
      clarifyHistory.current.push({
        question: currentQuestion.current,
        answer: text,
      })
      syncClarifyHistory()
      setState({ stage: "matching-codes" })
      const ts = Date.now()
      pipelineStart(ts)
      codeMatcher.submit({
        input: currentInput.current,
        sectionIds: sectionIds.current,
        clarifyHistory: clarifyHistory.current,
        round: clarifyRound.current,
        startedAt: ts,
      })
    },
    [codeMatcher]
  )

  const refineEarlyClarify = useCallback(
    (text: string) => {
      currentInput.current = text
      setInputValue(text)
      clarifyHistory.current = []
      clarifyRound.current = 0
      sectionIds.current = []
      setClarifyHistoryState([])
      matchedShownAtRef.current = null
      setState({ stage: "classifying" })
      const ts = Date.now()
      pipelineStart(ts)
      intentGate.submit({ input: text, startedAt: ts })
    },
    [intentGate]
  )

  const edit = useCallback(() => {
    const anchor = lastPipelineStartedAtRef.current
    const durationMs = anchor != null ? Math.max(0, Date.now() - anchor) : 0
    logPickerEvent({
      event: "edit-triggered",
      input: currentInput.current,
      result: { previousStage: stateRef.current.stage },
      durationMs,
    })
    clarifyHistory.current = []
    clarifyRound.current = 0
    sectionIds.current = []
    setClarifyHistoryState([])
    matchedShownAtRef.current = null
    setEditMode(true)
    setState({ stage: "idle" })
  }, [])

  const retry = useCallback(() => {
    currentInput.current = ""
    setInputValue("")
    matchedShownAtRef.current = null
    clarifyHistory.current = []
    clarifyRound.current = 0
    sectionIds.current = []
    setClarifyHistoryState([])
    setEditMode(false)
    setState({ stage: "idle" })
  }, [])

  const handleRdbHandoff = useCallback(() => {
    if (state.stage === "matched") {
      const anchor = matchedShownAtRef.current
      const durationMs = anchor != null ? Math.max(0, Date.now() - anchor) : 0
      logPickerEvent({
        event: "rdb-handoff",
        input: currentInput.current,
        result: { codes: state.codes },
        durationMs,
      })
    }
  }, [state])

  const isStreaming =
    intentGate.isLoading || sectionMatcher.isLoading || codeMatcher.isLoading

  return {
    state,
    isStreaming,
    input: inputValue,
    startedAt,
    editMode,
    clarifyHistory: clarifyHistoryState,
    submit,
    selectClarifyOption,
    submitCustomClarify,
    refineEarlyClarify,
    edit,
    retry,
    handleRdbHandoff,
  }
}
