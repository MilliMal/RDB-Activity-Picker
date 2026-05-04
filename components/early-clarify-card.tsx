"use client"

import { useId, useState } from "react"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EarlyClarifyCardProps {
  reason: string
  onRefine: (text: string) => void
  startedAt: number | null
}

export function EarlyClarifyCard({
  reason,
  onRefine,
  startedAt,
}: EarlyClarifyCardProps) {
  const [text, setText] = useState("")
  const inputId = useId()

  return (
    <div className="flex w-full flex-col gap-2">
      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="gap-3 p-4">
          <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

          <p
            className="text-[13px] leading-[160%] text-[#EBEBEB]"
            role="status"
            aria-live="polite"
          >
            {reason}
          </p>

          <label htmlFor={inputId} className="sr-only">
            Refined business description
          </label>
          <div className="flex w-full items-center gap-2 rounded-[12px] bg-[#1C1C1C] px-3 py-3">
            <Input
              id={inputId}
              name="early-clarify-refinement"
              autoComplete="off"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  onRefine(text.trim())
                }
              }}
              placeholder="Describe your business in more detail..."
              className="h-auto flex-1 border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none outline-none placeholder:text-[#505050] focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              size="xs"
              onClick={() => text.trim() && onRefine(text.trim())}
              disabled={!text.trim()}
              className="shrink-0 bg-[#2A2A2A] text-[#EBEBEB] hover:bg-[#3A3A3A]"
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
