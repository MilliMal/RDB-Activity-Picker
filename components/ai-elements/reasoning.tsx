"use client"

import {
  createContext,
  memo,
  type ComponentProps,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { BrainIcon, ChevronDownIcon } from "lucide-react"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"

interface ReasoningContextValue {
  isStreaming: boolean
  isOpen: boolean
  duration: number | undefined
  setIsOpen: (open: boolean) => void
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null)

function useReasoning() {
  const context = useContext(ReasoningContext)
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning")
  }
  return context
}

export type ReasoningProps = ComponentProps<"div"> & {
  isStreaming?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  duration?: number
}

export const Reasoning = memo(function Reasoning({
  className,
  isStreaming = false,
  open,
  defaultOpen,
  onOpenChange,
  duration: durationProp,
  children,
  ...props
}: ReasoningProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    defaultOpen ?? isStreaming
  )
  const isOpen =
    open ?? (isStreaming && defaultOpen !== false ? true : uncontrolledOpen)

  const setIsOpen = useCallback((nextOpen: boolean) => {
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }, [onOpenChange, open])

  const value = useMemo(
    () => ({ duration: durationProp, isOpen, isStreaming, setIsOpen }),
    [durationProp, isOpen, isStreaming, setIsOpen]
  )

  return (
    <ReasoningContext.Provider value={value}>
      <div className={cn("not-prose", className)} {...props}>
        {children}
      </div>
    </ReasoningContext.Provider>
  )
})

export type ReasoningTriggerProps = ComponentProps<"button"> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode
}

function defaultGetThinkingMessage(isStreaming: boolean, duration?: number) {
  if (isStreaming) return "Thinking..."
  if (duration === undefined) return "Thought for a few seconds"
  return `Thought for ${duration} second${duration === 1 ? "" : "s"}`
}

export const ReasoningTrigger = memo(function ReasoningTrigger({
  className,
  children,
  getThinkingMessage = defaultGetThinkingMessage,
  type = "button",
  ...props
}: ReasoningTriggerProps) {
  const { isStreaming, isOpen, duration, setIsOpen } = useReasoning()

  return (
    <button
      type={type}
      className={cn(
        "flex w-full items-center gap-2 text-left text-[13px] text-[#808080] transition-colors hover:text-[#AAAAAA]",
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children ?? (
        <>
          <BrainIcon className="size-4 shrink-0" aria-hidden />
          <span>{getThinkingMessage(isStreaming, duration)}</span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform",
              isOpen && "rotate-180"
            )}
            aria-hidden
          />
        </>
      )}
    </button>
  )
})

export type ReasoningContentProps = ComponentProps<"div"> & {
  children: string
}

export const ReasoningContent = memo(function ReasoningContent({
  className,
  children,
  ...props
}: ReasoningContentProps) {
  const { isOpen, isStreaming } = useReasoning()
  if (!isOpen) return null

  return (
    <div
      className={cn(
        "mt-2 max-h-50 overflow-y-auto text-[13px] leading-[160%] text-[#808080]",
        isStreaming && "thinking-content-shimmer",
        className
      )}
      {...props}
    >
      <Streamdown className="thinking-content-markdown [&_*]:text-[#808080]">
        {children}
      </Streamdown>
    </div>
  )
})
