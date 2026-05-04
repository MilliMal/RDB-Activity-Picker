"use client"

import { useState } from "react"
import { ExternalLinkIcon } from "lucide-react"

import { MessageResponse } from "@/components/ai-elements/message"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RDB_PORTAL_URL } from "@/lib/constants"
import type { MatchedCode } from "@/lib/types"

interface MatchResultsProps {
  codes: MatchedCode[]
  businessUnderstanding: string
  onBrowseTable: () => void
  onRegister: () => void
  startedAt: number | null
}

export function MatchResults({
  codes,
  businessUnderstanding,
  onBrowseTable,
  onRegister,
  startedAt,
}: MatchResultsProps) {
  const [copied, setCopied] = useState(false)

  function handleRegister() {
    const codeStr = codes.map((c) => c.code).join(", ")
    navigator.clipboard.writeText(codeStr).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onRegister()
    window.open(RDB_PORTAL_URL, "_blank")
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
        <CardContent className="gap-3 p-4">
          <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

          <div
            className="rounded-[12px] border border-[#2A2A2A] bg-[#111111] px-3 py-2.5"
            role="status"
            aria-live="polite"
          >
            <p className="text-[11px] font-medium tracking-wide text-[#666666] uppercase">
              How we understood your business
            </p>
            <MessageResponse className="mt-1.5 text-[13px] leading-[160%] text-[#CCCCCC]">
              {businessUnderstanding}
            </MessageResponse>
          </div>

          <p className="text-[13px] leading-[160%] text-[#EBEBEB]">
            Based on that, here are the closest matching activity codes:
          </p>

          <div className="flex flex-col gap-0">
            {codes.map((code) => (
              <div
                key={code.code}
                className="flex flex-col gap-1.5 rounded-[12px] px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-[5px] border border-[#248428] bg-[#052608] px-2 py-0.75">
                    <span className="text-[11px] leading-3.5 font-bold tracking-[0.5px] text-[#45C15B]">
                      {code.code}
                    </span>
                  </div>
                  <span className="text-[13px] leading-4 font-medium text-[#EBEBEB]">
                    {code.name}
                  </span>
                </div>
                <MessageResponse className="text-xs leading-[150%] text-[#888888]">
                  {code.reason}
                </MessageResponse>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={onBrowseTable}
            className="h-auto justify-center gap-1.5 rounded-[10px] border-[#2A2A2A] bg-[#111111] px-4 py-2.5 hover:bg-[#1A1A1A]"
          >
            <span className="text-xs text-[#888888]">Not your activity?</span>
            <span className="text-xs font-medium text-[#474747] underline underline-offset-2">
              Browse full activity table
            </span>
            <ExternalLinkIcon className="size-3 text-[#3DCA50]" />
          </Button>

          <Button
            onClick={handleRegister}
            variant="outline"
            className="w-full border-[#248428] bg-[#1A2E1A] text-[#45C15B] hover:bg-[#1F3A1F] hover:text-[#45C15B]"
          >
            {copied ? "Codes copied!" : "Register with these codes →"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
