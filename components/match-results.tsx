"use client"

import { ExternalLinkIcon } from "lucide-react"

import { MessageResponse } from "@/components/ai-elements/message"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Card, CardContent } from "@/components/ui/card"
import type { MatchedCode, ThinkingSegment } from "@/lib/types"

interface MatchResultsProps {
  codes: MatchedCode[]
  businessUnderstanding: string
  onBrowseTable: () => void
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
              {codes.map((code) => (
                <div
                  key={code.code}
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
                </div>
              ))}
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 px-4 py-2.5">
              <span className="text-[12px] leading-4 text-[#888888]">
                Not your activity?
              </span>
              <button
                type="button"
                onClick={onBrowseTable}
                className="inline-flex items-center gap-1 rounded-[2px] text-[12px] font-medium leading-4 text-[#2563EB] underline underline-offset-2 outline-none transition-colors hover:text-[#3B82F6] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                Browse full activity table
                <ExternalLinkIcon className="size-3 shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
