"use client"

import { Button } from "@/components/ui/button"

interface RetryLinkProps {
  onRetry: () => void
}

export function RetryLink({ onRetry }: RetryLinkProps) {
  return (
    <div className="flex items-start justify-center gap-1">
      <span className="text-sm leading-[130%] tracking-[-0.04em] text-[#AAAAAA]">
        Not sure about the answer?
      </span>
      <Button
        variant="link"
        onClick={onRetry}
        className="h-auto p-0 text-sm leading-[130%] tracking-[-0.04em] text-[#AAAAAA] underline underline-offset-2 hover:text-[#EBEBEB]"
      >
        Retry here!
      </Button>
    </div>
  )
}
