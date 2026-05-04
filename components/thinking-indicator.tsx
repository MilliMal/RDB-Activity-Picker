"use client"

import { useEffect, useState } from "react"

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"

interface ThinkingIndicatorProps {
  isStreaming: boolean
  startedAt: number | null
  reasoningText?: string
}

export function ThinkingIndicator({
  isStreaming,
  startedAt,
  reasoningText,
}: ThinkingIndicatorProps) {
  const [seconds, setSeconds] = useState(() =>
    startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 0
  )

  useEffect(() => {
    if (!startedAt) return

    function update() {
      setSeconds(Math.max(1, Math.floor((Date.now() - startedAt!) / 1000)))
    }

    if (isStreaming) {
      const interval = setInterval(update, 500)
      return () => clearInterval(interval)
    }
  }, [isStreaming, startedAt])

  return (
    <Reasoning
      isStreaming={isStreaming}
      duration={seconds}
      defaultOpen={true}
      className="w-full"
    >
      <ReasoningTrigger
        getThinkingMessage={(streaming, duration) =>
          streaming
            ? "Thinking..."
            : `Thought for ${duration ?? seconds} second${
                (duration ?? seconds) === 1 ? "" : "s"
              }`
        }
      />
      <ReasoningContent>
        {reasoningText ??
          (isStreaming
            ? "Reviewing the business description and comparing it with the official activity code table."
            : "Matched the description against the official activity code table and selected the closest available registration codes.")}
      </ReasoningContent>
    </Reasoning>
  )
}
