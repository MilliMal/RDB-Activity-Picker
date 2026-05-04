"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
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
  const [dotTick, setDotTick] = useState(0)
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
        setDotTick(0)
      }, 0)
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000))
        setDotTick((t) => t + 1)
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
    ? `Thinking${".".repeat((dotTick % 3) + 1)}`
    : `Thought for ${seconds} second${seconds !== 1 ? "s" : ""}`

  return (
    <div
      className="flex flex-col gap-2 rounded-[20px] p-4"
      style={{ backgroundColor: "#151515" }}
    >
      <button
        className="flex items-center gap-2 text-left"
        onClick={() => !isStreaming && setOpen((o) => !o)}
      >
        <span className="text-[13px]" style={{ color: "#808080" }}>
          {label}
        </span>
        {!isStreaming && (
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform",
              open && "rotate-180"
            )}
            style={{ color: "#808080" }}
          />
        )}
      </button>

      {!isStreaming && open && reasoningText && (
        <div
          className="max-h-[200px] overflow-hidden rounded-[10px] px-3 py-2"
          style={{
            backgroundColor: "rgba(14,14,14,0.3)",
            border: "1px solid rgba(38,38,38,0.2)",
          }}
        >
          <p className="text-[11px] leading-[160%]" style={{ color: "rgba(128,128,128,0.6)" }}>
            {reasoningText}
          </p>
        </div>
      )}
    </div>
  )
}
