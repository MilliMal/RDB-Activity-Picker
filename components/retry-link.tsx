"use client"

interface RetryLinkProps {
  onRetry: () => void
}

export function RetryLink({ onRetry }: RetryLinkProps) {
  return (
    <div className="flex items-start justify-center gap-1">
      <span
        className="text-[14px] leading-[130%]"
        style={{ color: "#AAAAAA", letterSpacing: "-0.04em" }}
      >
        Not sure about the answer?
      </span>
      <button
        onClick={onRetry}
        className="text-[14px] leading-[130%] underline underline-offset-2"
        style={{ color: "#AAAAAA", letterSpacing: "-0.04em" }}
      >
        Retry here!
      </button>
    </div>
  )
}
