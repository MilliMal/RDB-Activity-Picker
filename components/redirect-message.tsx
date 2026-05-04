"use client"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"

interface RedirectMessageProps {
  reason: string
  onRetry: () => void
  onSelectExample: (prompt: string) => void
  examplesDisabled?: boolean
  startedAt: number | null
}

const EXAMPLE_PROMPTS = [
  "I sell clothing and accessories from a shop in Kigali",
  "I run a bakery that sells bread and cakes",
  "I grow and sell vegetables from my farm",
]

export function RedirectMessage({
  reason,
  onRetry,
  onSelectExample,
  examplesDisabled = false,
  startedAt,
}: RedirectMessageProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

      <div
        className="flex w-full flex-col gap-3 rounded-[20px] p-4"
        style={{ backgroundColor: "#151515" }}
      >
        <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
          {reason
            ? reason
            : "That doesn't look like a business description. Try describing what your business sells or does."}
        </p>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px]" style={{ color: "#555555" }}>
            Try one of these examples:
          </p>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={examplesDisabled}
              className="rounded-[12px] px-3 py-2.5 text-left text-[12px] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "#1C1C1C", color: "#888888" }}
              onClick={() => onSelectExample(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={onRetry}
          className="text-[#AAAAAA] hover:text-[#EBEBEB]"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
