"use client"

import { useRef, useState, useEffect } from "react"
import { ArrowUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ActivityInputProps {
  onSubmit: (input: string) => { hint: string | null } | void
  disabled: boolean
  hint?: string | null
  defaultValue?: string
  placeholder?: string
}

export function ActivityInput({
  onSubmit,
  disabled,
  hint,
  defaultValue = "",
  placeholder = 'e.g. "I sell clothing and accessories from a shop in Kigali"',
}: ActivityInputProps) {
  const [value, setValue] = useState(defaultValue)
  const [localHint, setLocalHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultValue) {
      inputRef.current?.focus()
    }
  }, [defaultValue])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    const result = onSubmit(trimmed)
    if (result?.hint) {
      setLocalHint(result.hint)
    } else {
      setLocalHint(null)
    }
  }

  const displayHint = hint ?? localHint

  return (
    <div className="flex w-full flex-col gap-[15px]">
      <div className="flex w-full flex-col items-center gap-1.5">
        <div
          className="flex w-full items-center overflow-hidden rounded-full border px-3 py-3"
          style={{
            backgroundColor: "#202020",
            borderColor: "rgba(255,255,255,0.15)",
            boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "h-auto flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0",
              "placeholder:text-[#505050]",
              "text-[#EBEBEB]"
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            size="icon-sm"
            className={cn(
              "ml-2 size-7 shrink-0 rounded-[14px]",
              "bg-[#0E0E0E] hover:bg-[#1A1A1A]",
              "border border-transparent",
              disabled || !value.trim() ? "opacity-50" : "opacity-100"
            )}
          >
            <ArrowUpIcon className="size-4 text-[#808080]" />
          </Button>
        </div>
        {displayHint && (
          <p className="text-center text-xs" style={{ color: "#FF6B6B" }}>
            {displayHint}
          </p>
        )}
      </div>
      <p
        className="text-center text-[13px] leading-none"
        style={{ color: "#515151" }}
      >
        Be as specific as possible. Include what you sell or do, who your
        customers are, and how you operate.
      </p>
    </div>
  )
}
