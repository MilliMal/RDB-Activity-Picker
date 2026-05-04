"use client"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"

interface FallbackMessageProps {
  reason: "validation-error" | "max-rounds"
  onBrowseTable: () => void
  onRetry: () => void
  startedAt: number | null
}

export function FallbackMessage({
  reason,
  onBrowseTable,
  onRetry,
  startedAt,
}: FallbackMessageProps) {
  const message =
    reason === "max-rounds"
      ? "After a few clarifications we still couldn't narrow it down. Browse the full table to find your activity."
      : "We couldn't match your business to a specific activity. Browse the full table or try a different description."

  return (
    <div className="flex w-full flex-col gap-2">
      <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

      <div
        className="flex w-full flex-col gap-3 rounded-[20px] p-4"
        style={{ backgroundColor: "#151515" }}
      >
        <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
          {message}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={onBrowseTable}
            className="flex-1 bg-[#1C1C1C] text-[#EBEBEB] hover:bg-[#2A2A2A]"
            style={{ border: "1px solid #2A2A2A" }}
          >
            Browse table
          </Button>
          <Button
            variant="ghost"
            onClick={onRetry}
            className="flex-1 text-[#AAAAAA] hover:text-[#EBEBEB]"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
