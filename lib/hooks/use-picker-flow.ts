"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
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
  LiveThinkingPlacement,
  MatchedCode,
  Section,
  ThinkingPipelinePhase,
  ThinkingSegment,
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

  const [initialThinkingSegments, setInitialThinkingSegments] = useState<
    ThinkingSegment[]
  >([])
  const [clarifyAnswerThinking, setClarifyAnswerThinking] = useState<
    Record<number, ThinkingSegment[]>
  >({})

  const intentRunStartedAt = useRef<number | null>(null)
  const sectionRunStartedAt = useRef<number | null>(null)
  const codeRunStartedAt = useRef<number | null>(null)
  const codeSubmitKind = useRef<"initial" | "clarify">("initial")
  const codeSubmitClarifyIndex = useRef(0)

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

  /** Ref is authoritative for API payloads; resync UI state if they diverge */
  useEffect(() => {
    if (state.stage !== "clarify" && state.stage !== "matched") return
    if (clarifyHistory.current.length === 0) return
    setClarifyHistoryState((prev) => {
      if (prev.length >= clarifyHistory.current.length) return prev
      return [...clarifyHistory.current]
    })
  }, [state.stage])

  const sectionIds = useRef<string[]>([])
  const clarifyHistory = useRef<{ question: string; answer: string }[]>([])

  const resetThinkingTimeline = useCallback(() => {
    setInitialThinkingSegments([])
    setClarifyAnswerThinking({})
    intentRunStartedAt.current = null
    sectionRunStartedAt.current = null
    codeRunStartedAt.current = null
  }, [])
  const clarifyRound = useRef(0)
  const currentQuestion = useRef("")
  const currentInput = useRef("")

  const { check } = useClientHeuristic()

  const appendCodeThinkingSegment = useCallback(() => {
    const started = codeRunStartedAt.current
    if (started == null) return
    const completedAt = Date.now()
    if (codeSubmitKind.current === "clarify") {
      const idx = codeSubmitClarifyIndex.current
      const seg: ThinkingSegment = {
        phase: "stream-codes",
        startedAt: started,
        completedAt,
      }
      setClarifyAnswerThinking((prev) => ({
        ...prev,
        [idx]: [...(prev[idx] ?? []), seg],
      }))
    } else {
      const bundleStart = intentRunStartedAt.current ?? started
      setInitialThinkingSegments([
        {
          phase: "stream-initial-pipeline",
          startedAt: bundleStart,
          completedAt,
        },
      ])
    }
  }, [])

  const handleCodeResult = useCallback((result: unknown) => {
    const r = result as {
      type?: string
      codes?: MatchedCode[]
      businessUnderstanding?: string
      question?: string
      options?: ClarifyOption[]
    } | null

    if (!r || r.type === "fallback") {
      matchedShownAtRef.current = null
      setState({ stage: "fallback", reason: "validation-error" })
      return
    }
    if (
      r.type === "match" &&
      r.codes &&
      r.codes.length > 0 &&
      typeof r.businessUnderstanding === "string" &&
      r.businessUnderstanding.trim().length > 0
    ) {
      matchedShownAtRef.current = Date.now()
      // Keep React state aligned with the ref (fixes clarify Q&A missing from the feed at match time).
      if (clarifyHistory.current.length > 0) {
        setClarifyHistoryState([...clarifyHistory.current])
      }
      setState({
        stage: "matched",
        codes: r.codes,
        businessUnderstanding: r.businessUnderstanding.trim(),
      })
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
      appendCodeThinkingSegment()
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
      codeSubmitKind.current = "initial"
      codeRunStartedAt.current = ts
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
        sectionRunStartedAt.current = ts
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
        const intentStart = intentRunStartedAt.current
        if (intentStart != null) {
          setInitialThinkingSegments([
            {
              phase: "stream-intent",
              startedAt: intentStart,
              completedAt: Date.now(),
            },
          ])
        }
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
      sectionRunStartedAt.current = ts
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
      resetThinkingTimeline()

      setState({ stage: "classifying" })
      const ts = Date.now()
      pipelineStart(ts)
      intentRunStartedAt.current = ts
      intentGate.submit({ input, startedAt: ts })
      return { hint: null }
    },
    [check, intentGate, resetThinkingTimeline]
  )

  const selectClarifyOption = useCallback(
    (option: ClarifyOption) => {
      flushSync(() => {
        setClarifyHistoryState((prev) => {
          const next = [
            ...prev,
            {
              question: currentQuestion.current,
              answer: option.label,
            },
          ]
          clarifyHistory.current = next
          return next
        })
        setState({ stage: "matching-codes" })
      })
      const ts = Date.now()
      pipelineStart(ts)
      codeSubmitKind.current = "clarify"
      codeSubmitClarifyIndex.current = clarifyHistory.current.length - 1
      codeRunStartedAt.current = ts
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
      flushSync(() => {
        setClarifyHistoryState((prev) => {
          const next = [
            ...prev,
            {
              question: currentQuestion.current,
              answer: text,
            },
          ]
          clarifyHistory.current = next
          return next
        })
        setState({ stage: "matching-codes" })
      })
      const ts = Date.now()
      pipelineStart(ts)
      codeSubmitKind.current = "clarify"
      codeSubmitClarifyIndex.current = clarifyHistory.current.length - 1
      codeRunStartedAt.current = ts
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
      resetThinkingTimeline()
      setState({ stage: "classifying" })
      const ts = Date.now()
      pipelineStart(ts)
      intentRunStartedAt.current = ts
      intentGate.submit({ input: text, startedAt: ts })
    },
    [intentGate, resetThinkingTimeline]
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
    resetThinkingTimeline()
    setEditMode(true)
    setState({ stage: "idle" })
  }, [resetThinkingTimeline])

  const retry = useCallback(() => {
    currentInput.current = ""
    setInputValue("")
    matchedShownAtRef.current = null
    clarifyHistory.current = []
    clarifyRound.current = 0
    sectionIds.current = []
    setClarifyHistoryState([])
    resetThinkingTimeline()
    setEditMode(false)
    setState({ stage: "idle" })
  }, [resetThinkingTimeline])

  const isStreaming =
    intentGate.isLoading || sectionMatcher.isLoading || codeMatcher.isLoading

  const liveThinking = useMemo((): {
    placement: LiveThinkingPlacement
    phase: ThinkingPipelinePhase
    startedAt: number | null
  } | null => {
    if (intentGate.isLoading) {
      return {
        placement: { placement: "initial" },
        phase: "stream-intent",
        startedAt: intentRunStartedAt.current,
      }
    }
    if (sectionMatcher.isLoading) {
      return {
        placement: { placement: "initial" },
        phase: "stream-sections",
        startedAt: sectionRunStartedAt.current,
      }
    }
    if (codeMatcher.isLoading) {
      const placement: LiveThinkingPlacement =
        codeSubmitKind.current === "clarify"
          ? {
              placement: "clarify",
              answerIndex: codeSubmitClarifyIndex.current,
            }
          : { placement: "initial" }
      return {
        placement,
        phase: "stream-codes",
        startedAt: codeRunStartedAt.current,
      }
    }
    return null
  }, [intentGate.isLoading, sectionMatcher.isLoading, codeMatcher.isLoading])

  return {
    state,
    isStreaming,
    input: inputValue,
    startedAt,
    editMode,
    clarifyHistory: clarifyHistoryState,
    initialThinkingSegments,
    clarifyAnswerThinking,
    liveThinking,
    submit,
    selectClarifyOption,
    submitCustomClarify,
    refineEarlyClarify,
    edit,
    retry,
  }
}
