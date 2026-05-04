"use client"

import { useState } from "react"
import { ExternalLinkIcon } from "lucide-react"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { RDB_PORTAL_URL } from "@/lib/constants"
import type { MatchedCode } from "@/lib/types"

interface MatchResultsProps {
  codes: MatchedCode[]
  onBrowseTable: () => void
  onRegister: () => void
  startedAt: number | null
}

export function MatchResults({
  codes,
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
      <ThinkingIndicator isStreaming={false} startedAt={startedAt} />

      <div
        className="flex w-full flex-col gap-3 rounded-[20px] p-4"
        style={{ backgroundColor: "#151515" }}
      >
        <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
          Based on your description, here are your best matching activity codes:
        </p>

        <div className="flex flex-col gap-0">
          {codes.map((code) => (
            <div key={code.code} className="flex flex-col gap-1.5 rounded-[12px] px-3 py-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center rounded-[5px] px-2 py-[3px]"
                  style={{
                    backgroundColor: "#052608",
                    border: "1px solid #248428",
                  }}
                >
                  <span
                    className="text-[11px] font-bold"
                    style={{
                      color: "oklch(73.1% 0.216 148.3)",
                      letterSpacing: "0.5px",
                      lineHeight: "14px",
                    }}
                  >
                    {code.code}
                  </span>
                </div>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "#EBEBEB", lineHeight: "16px" }}
                >
                  {code.name}
                </span>
              </div>
              <p
                className="text-[12px] leading-[150%]"
                style={{ color: "#888888" }}
              >
                {code.reason}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onBrowseTable}
          className="flex items-center justify-center gap-1.5 rounded-[10px] px-4 py-2.5"
          style={{
            backgroundColor: "#111111",
            border: "1px solid #2A2A2A",
          }}
        >
          <span className="text-[12px]" style={{ color: "#888888" }}>
            Not your activity?
          </span>
          <span
            className="text-[12px] font-medium underline underline-offset-2"
            style={{ color: "#474747" }}
          >
            Browse full activity table
          </span>
          <ExternalLinkIcon className="size-3" style={{ color: "#3DCA50" }} />
        </button>

        <Button
          onClick={handleRegister}
          className="w-full bg-[#1A2E1A] text-[#45C15B] hover:bg-[#1F3A1F]"
          style={{ border: "1px solid #248428" }}
        >
          {copied ? "Codes copied!" : "Register with these codes →"}
        </Button>
      </div>
    </div>
  )
}
