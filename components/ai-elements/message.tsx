"use client"

import { memo, type ComponentProps, type HTMLAttributes } from "react"
import type { UIMessage } from "ai"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"]
}

export function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        "group flex w-full max-w-full flex-col gap-2",
        from === "user" ? "is-user items-end" : "is-assistant items-start",
        className
      )}
      {...props}
    />
  )
}

export function MessageContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-w-0 max-w-full text-sm text-[#EBEBEB]", className)}
      {...props}
    />
  )
}

export type MessageResponseProps = ComponentProps<typeof Streamdown>

export const MessageResponse = memo(function MessageResponse({
  className,
  ...props
}: MessageResponseProps) {
  return (
    <Streamdown
      className={cn(
        "size-full text-[13px] leading-[160%] text-[#EBEBEB] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    />
  )
})
