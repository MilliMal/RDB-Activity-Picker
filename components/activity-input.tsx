"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  const inputId = useId()
  const hintId = useId()

  useEffect(() => {
    if (defaultValue) {
      inputRef.current?.focus()
    }
  }, [defaultValue])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    const result = onSubmit(trimmed)
    setLocalHint(result?.hint ?? null)
  }

  const displayHint = hint ?? localHint

  return (
    <div className="flex w-full flex-col gap-3.75">
      <div className="flex w-full flex-col items-center gap-1.5">
        <label htmlFor={inputId} className="sr-only">
          Describe your business
        </label>
        <div className="flex w-full items-center overflow-hidden rounded-full border border-white/15 bg-[#202020] px-3 py-3 shadow-sm">
          <Input
            ref={inputRef}
            id={inputId}
            name="business-description"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={displayHint ? true : undefined}
            aria-describedby={displayHint ? hintId : undefined}
            className="h-auto flex-1 border-0 bg-transparent p-0 text-sm text-[#EBEBEB] shadow-none outline-none placeholder:text-[#505050] focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            size="icon-sm"
            aria-label="Submit business description"
            className={cn(
              "ml-2 size-7 shrink-0 rounded-[14px] border border-transparent bg-[#0E0E0E] hover:bg-[#1A1A1A]",
              disabled || !value.trim() ? "opacity-50" : "opacity-100"
            )}
          >
            <ArrowUpIcon className="size-4 text-[#808080]" aria-hidden />
          </Button>
        </div>
        {displayHint && (
          <p id={hintId} className="text-center text-xs text-[#FF6B6B]">
            {displayHint}
          </p>
        )}
      </div>
      <p className="text-center text-[13px] leading-none text-[#515151]">
        Be as specific as possible. Include what you sell or do, who your
        customers are, and how you operate.
      </p>
    </div>
  )
}
