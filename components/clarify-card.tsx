"use client"

import { useId, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { pressScale, pressTapTransition, transitionFast } from "@/lib/motion"
import type { ClarifyOption } from "@/lib/types"

const MotionButton = motion(Button)

interface ClarifyCardProps {
  question: string
  options: ClarifyOption[]
  onSelect: (option: ClarifyOption) => void
  onCustom: (text: string) => void
  round: number
  maxRounds: number
  startedAt: number | null
  /** When false, the question is only used for a11y — show it in the scroll feed from the parent */
  showQuestionInCard?: boolean
}

export function ClarifyCard({
  question,
  options,
  onSelect,
  onCustom,
  round,
  maxRounds,
  startedAt,
  showQuestionInCard = true,
}: ClarifyCardProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState("")
  const customInputId = useId()
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex w-full flex-col gap-2">
      <Card
        className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none"
        aria-label={!showQuestionInCard ? question : undefined}
      >
        <CardContent className="gap-2 p-4">
          <ThinkingIndicator
            isStreaming={false}
            startedAt={startedAt}
            phase="clarify"
          />

          {round > 1 && (
            <p className="text-[11px] text-[#555555]">
              Clarification {round} of {maxRounds}
            </p>
          )}

          {showQuestionInCard && (
            <p
              className="text-[13px] leading-[160%] text-[#EBEBEB]"
              role="status"
              aria-live="polite"
            >
              {question}
            </p>
          )}

          <div className="mt-1 flex flex-col gap-1.5">
            {options.map((opt) => (
              <MotionButton
                key={opt.value}
                variant="ghost"
                onClick={() => onSelect(opt)}
                className="h-auto w-full justify-start rounded-[12px] bg-[#1C1C1C] px-3 py-3 text-left text-xs leading-[150%] text-[#888888] transition-[color,background-color] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#252525] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#EBEBEB]"
                whileTap={reduceMotion ? undefined : { scale: pressScale, transition: pressTapTransition }}
                transition={transitionFast}
              >
                {opt.label}
              </MotionButton>
            ))}

            {!showCustom ? (
              <MotionButton
                variant="ghost"
                onClick={() => setShowCustom(true)}
                className="h-auto w-full justify-start rounded-[12px] bg-[#1C1C1C] px-3 py-3 text-left text-[13px] leading-4 font-medium text-[#EBEBEB] transition-[color,background-color] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#252525] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#EBEBEB]"
                whileTap={reduceMotion ? undefined : { scale: pressScale, transition: pressTapTransition }}
                transition={transitionFast}
              >
                Other
              </MotionButton>
            ) : (
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor={customInputId} className="sr-only">
                  Your clarification answer
                </label>
                <div className="flex w-full items-center gap-2 rounded-[12px] bg-[#1C1C1C] px-3 py-3">
                  <Input
                    id={customInputId}
                    name="clarify-custom-response"
                    autoComplete="off"
                    autoFocus
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customText.trim()) {
                        onCustom(customText.trim())
                      }
                    }}
                    placeholder="Type here"
                    className="h-auto flex-1 border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none outline-none placeholder:text-[#505050] focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0"
                  />
                  <MotionButton
                    type="button"
                    size="xs"
                    onClick={() =>
                      customText.trim() && onCustom(customText.trim())
                    }
                    disabled={!customText.trim()}
                    className="shrink-0 bg-[#2A2A2A] text-[#EBEBEB] transition-[color,background-color] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3A3A3A]"
                    whileTap={reduceMotion ? undefined : { scale: pressScale, transition: pressTapTransition }}
                    transition={transitionFast}
                  >
                    Submit
                  </MotionButton>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
