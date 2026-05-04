"use client"

import { useState } from "react"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ClarifyOption } from "@/lib/types"

interface ClarifyCardProps {
  question: string
  options: ClarifyOption[]
  onSelect: (value: string) => void
  onCustom: (text: string) => void
  round: number
  maxRounds: number
  startedAt: number | null
}

export function ClarifyCard({
  question,
  options,
  onSelect,
  onCustom,
  round,
  maxRounds,
  startedAt,
}: ClarifyCardProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState("")

  return (
    <div className="flex w-full flex-col gap-2">
      <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

      <div
        className="flex w-full flex-col gap-2 rounded-[20px] p-4"
        style={{ backgroundColor: "#151515" }}
      >
        {round > 1 && (
          <p className="text-[11px]" style={{ color: "#555555" }}>
            Clarification {round} of {maxRounds}
          </p>
        )}

        <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
          {question}
        </p>

        <div className="mt-1 flex flex-col gap-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="w-full rounded-[12px] px-3 py-3 text-left transition-colors hover:brightness-110"
              style={{ backgroundColor: "#1C1C1C" }}
            >
              <span className="text-[12px] leading-[150%]" style={{ color: "#888888" }}>
                {opt.label}
              </span>
            </button>
          ))}

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="flex w-full items-center gap-2 rounded-[12px] px-3 py-3 text-left transition-colors hover:brightness-110"
              style={{ backgroundColor: "#1C1C1C" }}
            >
              <span
                className="text-[13px] font-medium leading-[16px]"
                style={{ color: "#EBEBEB" }}
              >
                Other
              </span>
            </button>
          ) : (
            <div
              className="flex w-full items-center gap-2 rounded-[12px] px-3 py-3"
              style={{ backgroundColor: "#1C1C1C" }}
            >
              <Input
                autoFocus
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customText.trim()) {
                    onCustom(customText.trim())
                  }
                }}
                placeholder="Type here"
                className="h-auto flex-1 border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none outline-none placeholder:text-[#505050] focus-visible:ring-0"
              />
              <Button
                size="xs"
                onClick={() => customText.trim() && onCustom(customText.trim())}
                disabled={!customText.trim()}
                className="shrink-0 bg-[#2A2A2A] text-[#EBEBEB] hover:bg-[#3A3A3A]"
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
