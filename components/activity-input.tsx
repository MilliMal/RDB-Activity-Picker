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
import { cn } from "@/lib/utils"

/** Stable ids avoid hydration mismatches: parent trees (e.g. theme) can shift React useId() counters between SSR and client. */
const ACTIVITY_INPUT_ID = "rdb-activity-description"
const ACTIVITY_HINT_ID = "rdb-activity-input-hint"

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (defaultValue) {
      inputRef.current?.focus()
    }
  }, [defaultValue])

  function handleSubmit(message?: PromptInputMessage) {
    const submittedValue = message ? message.text : value
    const trimmed = submittedValue.trim()
    if (!trimmed || disabled) return
    const result = onSubmit(trimmed)
    setLocalHint(result?.hint ?? null)
  }

  const displayHint = hint ?? localHint

  return (
    <div className="flex w-full flex-col gap-3.75">
      <div className="flex w-full flex-col items-center gap-1.5">
        <label htmlFor={ACTIVITY_INPUT_ID} className="sr-only">
          Describe your business
        </label>
        <PromptInput
          onSubmit={handleSubmit}
          aria-invalid={displayHint ? true : undefined}
          aria-describedby={displayHint ? ACTIVITY_HINT_ID : undefined}
          data-disabled={disabled ? true : undefined}
          className="rounded-[18px]"
        >
          <PromptInputBody>
            <PromptInputTextarea
              ref={inputRef}
              id={ACTIVITY_INPUT_ID}
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-6"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              disabled={disabled || !value.trim()}
              className={cn(
                disabled || !value.trim() ? "opacity-50" : "opacity-100"
              )}
            />
          </PromptInputFooter>
        </PromptInput>
        {displayHint && (
          <p id={ACTIVITY_HINT_ID} className="text-center text-xs text-[#FF6B6B]">
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
