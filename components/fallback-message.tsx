"use client"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="gap-3 p-4">
          <ThinkingIndicator
            isStreaming={false}
            startedAt={startedAt}
            phase="fallback"
          />

          <p
            className="text-[13px] leading-[160%] text-[#EBEBEB]"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>

          <div className="flex gap-2">
            <Button
              onClick={onBrowseTable}
              variant="outline"
              className="flex-1 border-[#2A2A2A] bg-[#1C1C1C] text-[#EBEBEB] hover:bg-[#2A2A2A] hover:text-[#EBEBEB]"
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
        </CardContent>
      </Card>
    </div>
  )
}
