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
        "size-full max-w-full text-[13px] leading-[160%] text-[#EBEBEB] [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:[table-layout:auto] [&_th]:whitespace-normal [&_td]:whitespace-normal [&_th]:align-top [&_td]:align-top [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere]",
        className
      )}
      {...props}
    />
  )
})
