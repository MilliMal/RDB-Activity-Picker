"use client"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="gap-3 p-4">
          <p
            className="text-[13px] leading-[160%] text-[#EBEBEB]"
            role="status"
            aria-live="polite"
          >
            {reason
              ? reason
              : "That doesn't look like a business description. Try describing what your business sells or does."}
          </p>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-[#555555]">
              Try one of these examples:
            </p>
            {EXAMPLE_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="ghost"
                disabled={examplesDisabled}
                className="h-auto justify-start rounded-[12px] bg-[#1C1C1C] px-3 py-2.5 text-left text-xs text-[#888888] hover:bg-[#252525] hover:text-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onSelectExample(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={onRetry}
            className="text-[#AAAAAA] hover:text-[#EBEBEB]"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
