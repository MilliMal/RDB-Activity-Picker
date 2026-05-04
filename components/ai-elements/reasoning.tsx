"use client"

import {
  createContext,
  memo,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useId,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react"
import { BrainIcon, ChevronDownIcon } from "lucide-react"
import { Streamdown } from "streamdown"

import {
  easeOutStrong,
  pressScale,
  pressTapTransition,
  transitionFast,
  transitionUi,
} from "@/lib/motion"
import { cn } from "@/lib/utils"

type PresenceMotion = "full" | "instant"

interface ReasoningContextValue {
  isStreaming: boolean
  isOpen: boolean
  duration: number | undefined
  setIsOpen: (
    open: boolean,
    opts?: { inputMode?: "pointer" | "keyboard" }
  ) => void
  contentId: string
  presenceMotion: PresenceMotion
  setPresenceMotion: Dispatch<SetStateAction<PresenceMotion>>
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
  const contentId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    defaultOpen ?? isStreaming
  )
  const [presenceMotion, setPresenceMotion] =
    useState<PresenceMotion>("full")

  const isOpen =
    open ?? (isStreaming && defaultOpen !== false ? true : uncontrolledOpen)

  const setIsOpen = useCallback(
    (nextOpen: boolean, opts?: { inputMode?: "pointer" | "keyboard" }) => {
      const inputMode = opts?.inputMode ?? "pointer"
      setPresenceMotion(inputMode === "keyboard" ? "instant" : "full")
      if (open === undefined) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [onOpenChange, open]
  )

  const value = useMemo(
    () => ({
      contentId,
      duration: durationProp,
      isOpen,
      isStreaming,
      presenceMotion,
      setIsOpen,
      setPresenceMotion,
    }),
    [
      contentId,
      durationProp,
      isOpen,
      isStreaming,
      presenceMotion,
      setIsOpen,
      setPresenceMotion,
    ]
  )

  /**
   * Zero-duration "instant" opens do not reliably fire `onAnimationComplete` in Motion,
   * which left `presenceMotion === "instant"` stuck and killed all later transitions.
   */
  useEffect(() => {
    if (!isOpen || presenceMotion !== "instant") return
    const id = requestAnimationFrame(() => {
      setPresenceMotion("full")
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen, presenceMotion])

  return (
    <ReasoningContext.Provider value={value}>
      <div className={cn("not-prose", className)} {...props}>
        {children}
      </div>
    </ReasoningContext.Provider>
  )
})

export type ReasoningTriggerProps = HTMLMotionProps<"button"> & {
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
  onPointerDown: onPointerDownProp,
  onMouseDown: onMouseDownProp,
  onTouchStart: onTouchStartProp,
  onBlur: onBlurProp,
  onClick: onClickProp,
  ...props
}: ReasoningTriggerProps) {
  const { isStreaming, isOpen, duration, setIsOpen, contentId, presenceMotion } =
    useReasoning()
  const reduceMotion = useReducedMotion()
  const fromPointerRef = useRef(false)

  const instantUi = presenceMotion === "instant" || reduceMotion

  return (
    <motion.button
      type={type}
      layout={false}
      whileTap={
        reduceMotion
          ? undefined
          : { scale: pressScale, transition: pressTapTransition }
      }
      transition={transitionFast}
      className={cn(
        "reasoning-trigger flex w-full items-center gap-2 text-left text-[13px] text-[#808080] transition-colors duration-150 ease-out",
        className
      )}
      aria-expanded={isOpen}
      aria-controls={contentId}
      {...props}
      onPointerDown={(e) => {
        fromPointerRef.current = true
        onPointerDownProp?.(e)
      }}
      onMouseDown={(e) => {
        fromPointerRef.current = true
        onMouseDownProp?.(e)
      }}
      onTouchStart={(e) => {
        fromPointerRef.current = true
        onTouchStartProp?.(e)
      }}
      onBlur={(e) => {
        onBlurProp?.(e)
        fromPointerRef.current = false
      }}
      onClick={(e) => {
        onClickProp?.(e)
        const mode = fromPointerRef.current ? "pointer" : "keyboard"
        fromPointerRef.current = false
        setIsOpen(!isOpen, { inputMode: mode })
      }}
    >
      {children ?? (
        <>
          <BrainIcon className="size-4 shrink-0" aria-hidden />
          <span>{getThinkingMessage(isStreaming, duration)}</span>
          <motion.span
            className="inline-flex shrink-0"
            aria-hidden
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={
              instantUi ? { duration: 0 } : transitionUi
            }
          >
            <ChevronDownIcon className="size-4" />
          </motion.span>
        </>
      )}
    </motion.button>
  )
})

export type ReasoningContentProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: string
}

export const ReasoningContent = memo(function ReasoningContent({
  className,
  children,
  ...props
}: ReasoningContentProps) {
  const { isOpen, isStreaming, contentId, presenceMotion } = useReasoning()
  const reduceMotion = useReducedMotion()

  const keyboardInstant = presenceMotion === "instant"

  const presenceTransition = reduceMotion
    ? { duration: 0.12, ease: easeOutStrong }
    : keyboardInstant
      ? { duration: 0 }
      : { duration: transitionUi.duration, ease: easeOutStrong }

  const initialState = reduceMotion
    ? { opacity: 0 }
    : keyboardInstant
      ? false
      : { opacity: 0, y: "-6%" }

  const exitState = reduceMotion
    ? { opacity: 0 }
    : keyboardInstant
      ? { opacity: 0 }
      : { opacity: 0, y: "-4%" }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="reasoning-body"
          id={contentId}
          layout={false}
          initial={initialState}
          animate={{ opacity: 1, y: 0 }}
          exit={exitState}
          transition={presenceTransition}
          className={cn(
            "mt-2 max-h-50 overflow-y-auto text-[13px] leading-[160%] text-[#808080]",
            isStreaming && "thinking-content-shimmer",
            className
          )}
          {...props}
        >
          <Streamdown className="thinking-content-markdown max-w-full [overflow-wrap:anywhere] [&_*]:text-[#808080] [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:[table-layout:auto] [&_th]:whitespace-normal [&_td]:whitespace-normal [&_th]:align-top [&_td]:align-top [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere]">
            {children}
          </Streamdown>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
