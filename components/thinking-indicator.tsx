"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
  const [elapsed, setElapsed] = useState(0)
  const [frozenSeconds, setFrozenSeconds] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let resetId: ReturnType<typeof setTimeout> | undefined
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isStreaming && startedAt) {
      resetId = setTimeout(() => {
        setFrozenSeconds(null)
        setElapsed(0)
      }, 0)
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000))
      }
      intervalRef.current = setInterval(tick, 500)
    } else if (startedAt) {
      resetId = setTimeout(() => {
        setFrozenSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 0)
    }

    return () => {
      if (resetId) clearTimeout(resetId)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isStreaming, startedAt])

  const seconds = frozenSeconds != null ? frozenSeconds : elapsed
  const label = isStreaming
    ? "Thinking…"
    : `Thought for ${seconds} second${seconds !== 1 ? "s" : ""}`

  return (
    <Card className="rounded-[20px] border-0 bg-[#151515] shadow-none">
      <CardContent className="gap-2 p-4">
        <div role="status" aria-live="polite" aria-atomic="true">
          <Button
            variant="ghost"
            className="h-auto justify-start gap-2 p-0 text-left text-[13px] text-[#808080] hover:bg-transparent hover:text-[#AAAAAA]"
            onClick={() => !isStreaming && setOpen((o) => !o)}
          >
            {label}
            {!isStreaming && (
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-[#808080] transition-transform",
                  open && "rotate-180"
                )}
              />
            )}
          </Button>
        </div>

        {!isStreaming && open && reasoningText && (
          <div className="max-h-50 overflow-hidden rounded-[10px] border border-[#262626]/20 bg-[#0E0E0E]/30 px-3 py-2">
            <p className="text-[11px] leading-[160%] text-[#808080]/60">
              {reasoningText}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
