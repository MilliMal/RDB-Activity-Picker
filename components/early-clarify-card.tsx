"use client"

import { useEffect, useRef, useState } from "react"

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const EARLY_CLARIFY_INPUT_ID = "rdb-early-clarify-refinement"

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submitRefinement(message: PromptInputMessage) {
    const trimmed = message.text.trim()
    if (!trimmed) return
    onRefine(trimmed)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="gap-3 p-4">
          <ThinkingIndicator
            isStreaming={false}
            startedAt={startedAt}
            phase="early-clarify"
          />

          <p
            className="text-[13px] leading-[160%] text-[#EBEBEB]"
            role="status"
            aria-live="polite"
          >
            {reason}
          </p>

          <label htmlFor={EARLY_CLARIFY_INPUT_ID} className="sr-only">
            Refined business description
          </label>
          <PromptInput
            onSubmit={(msg) => submitRefinement(msg)}
            className="rounded-[14px]"
          >
            <PromptInputBody>
              <PromptInputTextarea
                ref={inputRef}
                id={EARLY_CLARIFY_INPUT_ID}
                autoComplete="off"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe your business in more detail..."
                className="min-h-[34px] max-h-28 px-2.5 py-2 text-[12px] leading-[150%]"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-2 pb-2 pt-1">
              <PromptInputSubmit
                disabled={!text.trim()}
                className={cn(
                  "size-6 shrink-0 rounded-[8px] [&_svg]:size-3.5",
                  !text.trim() ? "opacity-50" : "opacity-100"
                )}
              />
            </PromptInputFooter>
          </PromptInput>
        </CardContent>
      </Card>
    </div>
  )
}
