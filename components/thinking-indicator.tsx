"use client"

import { useEffect, useState } from "react"

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"

/** Where the thinking UI appears — drives default copy when `reasoningText` is omitted */
export type ThinkingPhase =
  | "stream-intent"
  | "stream-sections"
  | "stream-codes"
  | "stream-initial-pipeline"
  | "clarify"
  | "early-clarify"
  | "matched"
  | "fallback"
  | "redirect"

function streamingTriggerLabel(phase: ThinkingPhase): string {
  switch (phase) {
    case "stream-intent":
      return "Checking your description..."
    case "stream-sections":
      return "Finding relevant categories..."
    case "stream-codes":
      return "Matching activity codes..."
    case "stream-initial-pipeline":
      return "Working through your description..."
    default:
      return "Thinking..."
  }
}

function streamingBodyCopy(phase: ThinkingPhase): string {
  switch (phase) {
    case "stream-intent":
      return "Checking whether this looks like a business activity suitable for official registration codes."
    case "stream-sections":
      return "Scanning the activity list to find sections that could contain your business."
    case "stream-codes":
      return "Reviewing your description against the filtered activity codes."
    case "stream-initial-pipeline":
      return "Checking your description, finding relevant categories in the activity list, and matching against filtered codes."
    default:
      return "Working on the next step."
  }
}

function idleBodyCopy(phase: ThinkingPhase): string {
  switch (phase) {
    case "clarify":
      return "Using your answers to narrow down the best registration codes."
    case "early-clarify":
      return "Waiting for a clearer description so we can classify your business."
    case "matched":
      return "Matched the description against the official activity code table and selected the closest available registration codes."
    case "fallback":
      return "We could not produce a confident match from this step — try the full table or refine your description."
    case "redirect":
      return "This doesn’t look like a typical business activity registration query."
    case "stream-intent":
    case "stream-sections":
    case "stream-codes":
      return "Matched the description against the official activity code table and selected the closest available registration codes."
    case "stream-initial-pipeline":
      return "Checked your description, narrowed relevant categories, and matched against the filtered activity codes."
  }
}

interface ThinkingIndicatorProps {
  isStreaming: boolean
  startedAt: number | null
  /** When set and not streaming, duration is frozen (archived step) */
  completedAt?: number | null
  reasoningText?: string
  /** Controls default headlines + reasoning body when `reasoningText` is not passed */
  phase?: ThinkingPhase
}

export function ThinkingIndicator({
  isStreaming,
  startedAt,
  completedAt,
  reasoningText,
  phase = "stream-codes",
}: ThinkingIndicatorProps) {
  const archivedSeconds =
    startedAt != null &&
    completedAt != null &&
    !isStreaming &&
    completedAt >= startedAt
      ? Math.max(1, Math.floor((completedAt - startedAt) / 1000))
      : null

  const [seconds, setSeconds] = useState(() =>
    archivedSeconds != null
      ? archivedSeconds
      : startedAt
        ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000))
        : 0
  )

  useEffect(() => {
    if (!startedAt) return

    if (archivedSeconds != null) {
      setSeconds(archivedSeconds)
      return
    }

    function update() {
      setSeconds(Math.max(1, Math.floor((Date.now() - startedAt!) / 1000)))
    }

    if (isStreaming) {
      const interval = setInterval(update, 500)
      return () => clearInterval(interval)
    }
    update()
  }, [isStreaming, startedAt, archivedSeconds])

  const durationLabel = isStreaming ? seconds : Math.max(1, seconds)

  const resolvedBody =
    reasoningText?.trim() ||
    (isStreaming
      ? streamingBodyCopy(phase)
      : phase === "stream-intent" ||
          phase === "stream-sections" ||
          phase === "stream-codes" ||
          phase === "stream-initial-pipeline"
        ? streamingBodyCopy(phase)
        : idleBodyCopy(phase))

  return (
    <Reasoning
      isStreaming={isStreaming}
      duration={durationLabel}
      defaultOpen={isStreaming}
      className="w-full"
    >
      <ReasoningTrigger
        getThinkingMessage={(streaming, duration) => {
          if (streaming) {
            return streamingTriggerLabel(phase)
          }
          return `Thought for ${duration ?? durationLabel} second${
            (duration ?? durationLabel) === 1 ? "" : "s"
          }`
        }}
      />
      <ReasoningContent>{resolvedBody}</ReasoningContent>
    </Reasoning>
  )
}
