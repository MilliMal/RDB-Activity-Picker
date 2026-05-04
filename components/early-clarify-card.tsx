"use client"

import { useState } from "react"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EarlyClarifyCardProps {
  reason: string
  onRefine: (text: string) => void
  startedAt: number | null
}

export function EarlyClarifyCard({ reason, onRefine, startedAt }: EarlyClarifyCardProps) {
  const [text, setText] = useState("")

  return (
    <div className="flex w-full flex-col gap-2">
      <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

      <div
        className="flex w-full flex-col gap-3 rounded-[20px] p-4"
        style={{ backgroundColor: "#151515" }}
      >
        <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
          {reason}
        </p>

        <div
          className="flex w-full items-center gap-2 rounded-[12px] px-3 py-3"
          style={{ backgroundColor: "#1C1C1C" }}
        >
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                onRefine(text.trim())
              }
            }}
            placeholder="Describe your business in more detail..."
            className="h-auto flex-1 border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none outline-none placeholder:text-[#505050] focus-visible:ring-0"
          />
          <Button
            size="xs"
            onClick={() => text.trim() && onRefine(text.trim())}
            disabled={!text.trim()}
            className="shrink-0 bg-[#2A2A2A] text-[#EBEBEB] hover:bg-[#3A3A3A]"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
