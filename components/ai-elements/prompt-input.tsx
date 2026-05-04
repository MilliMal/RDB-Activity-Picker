"use client"

import {
  type ComponentProps,
  type FormEvent,
  type InputEvent,
  type KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import { CornerDownLeftIcon, LoaderCircleIcon, SquareIcon } from "lucide-react"
import type { ChatStatus } from "ai"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PromptInputMessage {
  text: string
  files: []
}

type PromptInputProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "onError"
> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>
}

export function PromptInput({
  className,
  children,
  onSubmit,
  ...props
}: PromptInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const text = String(formData.get("message") ?? "")
    onSubmit({ text, files: [] }, event)
  }

  return (
    <form
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[18px] border border-white/15 bg-[#202020] text-[#EBEBEB] shadow-sm transition-colors focus-within:border-white/35 focus-within:ring-2 focus-within:ring-white/20 aria-invalid:border-[#FF6B6B]/80 aria-invalid:ring-2 aria-invalid:ring-[#FF6B6B]/20 data-[disabled=true]:opacity-60",
        className
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  )
}

export function PromptInputBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("flex min-w-0", className)} {...props} />
}

export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea">
>(function PromptInputTextarea({ className, onInput, onKeyDown, ...props }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

  function resize(textarea: HTMLTextAreaElement) {
    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`
  }

  useEffect(() => {
    if (textareaRef.current) resize(textareaRef.current)
  }, [props.value])

  function handleInput(event: InputEvent<HTMLTextAreaElement>) {
    resize(event.currentTarget)
    onInput?.(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
      return
    }
    onKeyDown?.(event)
  }

  return (
    <textarea
      ref={textareaRef}
      name="message"
      rows={1}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={cn(
        "field-sizing-content max-h-48 min-h-6 flex-1 resize-none overflow-y-auto bg-transparent px-3.5 py-3 text-[13px] leading-[160%] text-[#EBEBEB] outline-none placeholder:text-[#505050] disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
})

export function PromptInputFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-end justify-end px-2.5 pb-2.5", className)}
      {...props}
    />
  )
}

type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus
  onStop?: () => void
}

export function PromptInputSubmit({
  className,
  status,
  onStop,
  onClick,
  children,
  ...props
}: PromptInputSubmitProps) {
  const isGenerating = status === "submitted" || status === "streaming"
  const icon =
    status === "submitted" ? (
      <LoaderCircleIcon className="size-4 animate-spin text-[#808080]" />
    ) : status === "streaming" ? (
      <SquareIcon className="size-3.5 text-[#808080]" />
    ) : (
      <CornerDownLeftIcon className="size-4 text-[#808080]" />
    )

  return (
    <Button
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn(
        "size-7 shrink-0 rounded-[10px] border border-transparent bg-[#0E0E0E] hover:bg-[#1A1A1A]",
        className
      )}
      onClick={(event) => {
        if (isGenerating && onStop) {
          event.preventDefault()
          onStop()
          return
        }
        onClick?.(event)
      }}
      size="icon-sm"
      type={isGenerating && onStop ? "button" : "submit"}
      {...props}
    >
      {children ?? icon}
    </Button>
  )
}
