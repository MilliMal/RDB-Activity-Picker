"use client"

import { ExternalLinkIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { MessageResponse } from "@/components/ai-elements/message"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Card, CardContent } from "@/components/ui/card"
import {
  easeOutStrong,
  pressScale,
  pressTapTransition,
  transitionFast,
  transitionUi,
} from "@/lib/motion"
import type { MatchedCode, ThinkingSegment } from "@/lib/types"
import type { PressInputMode } from "@/lib/use-pointer-press-source"
import { usePointerPressSource } from "@/lib/use-pointer-press-source"

interface MatchResultsProps {
  codes: MatchedCode[]
  businessUnderstanding: string
  onBrowseTable: (mode: PressInputMode) => void
  /**
   * Present after a clarify answer: one thought block covering the final code pass,
   * merged with synthesis copy (avoids a duplicate thought above the card).
   * Omit when matching without a clarify round — the bundled initial thought sits above.
   */
  matchPassThinking: ThinkingSegment | null
}

export function MatchResults({
  codes,
  businessUnderstanding,
  onBrowseTable,
  matchPassThinking,
}: MatchResultsProps) {
  const understanding = businessUnderstanding.trim()
  const browsePress = usePointerPressSource()
  const reduceMotion = useReducedMotion()

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col">
      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="flex flex-col gap-2 p-4">
          {matchPassThinking != null ? (
            <ThinkingIndicator
              isStreaming={false}
              startedAt={matchPassThinking.startedAt}
              completedAt={matchPassThinking.completedAt}
              phase="stream-codes"
              reasoningText={`${understanding}

Matched the description against the official activity code table and selected the closest available registration codes.`}
            />
          ) : (
            <p className="text-[13px] leading-[160%] text-[#AAAAAA]">
              {understanding}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <p
              className="text-[13px] leading-[160%] font-normal text-[#EBEBEB]"
              role="status"
            >
              Based on your description, here are your best matching activity
              codes:
            </p>

            <div className="flex flex-col gap-3">
              {codes.map((code, index) => (
                <motion.div
                  key={code.code}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "4%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0.12 : transitionUi.duration,
                    ease: easeOutStrong,
                    delay: index * 0.04,
                  }}
                  className="flex flex-col gap-1.5 rounded-[12px] px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex shrink-0 items-center rounded-[5px] border border-[#248428] bg-[#052608] px-2 py-0.75">
                      <span className="text-[11px] leading-[14px] font-bold tracking-[0.5px] text-[#45C15B]">
                        {code.code}
                      </span>
                    </div>
                    <span className="text-[13px] leading-4 font-medium text-[#EBEBEB]">
                      {code.name}
                    </span>
                  </div>
                  <MessageResponse className="text-[12px] leading-[150%] text-[#888888]">
                    {code.reason}
                  </MessageResponse>
                </motion.div>
              ))}
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 px-4 py-2.5">
              <span className="text-[12px] leading-4 text-[#888888]">
                Not your activity?
              </span>
              <motion.button
                type="button"
                {...browsePress.bind}
                onClick={browsePress.wrapClick(onBrowseTable)}
                className="inline-flex items-center gap-1 rounded-[2px] text-[12px] font-medium leading-4 text-[#2563EB] underline underline-offset-2 outline-none transition-[color,opacity] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#3B82F6] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                whileTap={reduceMotion ? undefined : { scale: pressScale, transition: pressTapTransition }}
                transition={transitionFast}
              >
                Browse full activity table
                <ExternalLinkIcon className="size-3 shrink-0" aria-hidden />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
