import type { PickerEvent } from "@/lib/types"

type AnalyticsProvider = "console" | "vercel" | "posthog"

/**
 * PROMPT: `ANALYTICS_PROVIDER`. On the client, Next.js only inlines
 * `NEXT_PUBLIC_ANALYTICS_PROVIDER`; server reads `ANALYTICS_PROVIDER` first.
 */
function readProvider(): AnalyticsProvider {
  if (typeof process === "undefined") return "console"
  const raw = (
    process.env.ANALYTICS_PROVIDER ??
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ??
    ""
  ).trim()
    .toLowerCase()
  if (raw === "vercel" || raw === "posthog") return raw
  return "console"
}

/** PROMPT: `POSTHOG_KEY`. Client bundles need `NEXT_PUBLIC_POSTHOG_KEY` if logging from the browser. */
function readPosthogKey(): string | undefined {
  if (typeof process === "undefined") return undefined
  const k = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY
  return k?.trim() || undefined
}

/** PROMPT: optional `POSTHOG_HOST`; default PostHog US ingest. */
function readPosthogHost(): string {
  if (typeof process === "undefined") return "https://us.i.posthog.com"
  const h = process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
  return h.replace(/\/$/, "")
}

function vercelProps(
  event: PickerEvent
): Record<string, string | number | boolean | null | undefined> {
  return {
    pickerEvent: event.event,
    input: event.input,
    durationMs: event.durationMs,
    round: event.round ?? null,
    resultJson: JSON.stringify(event.result),
  }
}

async function sendVercel(event: PickerEvent): Promise<void> {
  const name = `picker_${event.event}`
  const props = vercelProps(event)
  if (typeof window === "undefined") {
    const { track } = await import("@vercel/analytics/server")
    await track(name, props).catch(() => {})
  } else {
    const { track } = await import("@vercel/analytics")
    track(name, props)
  }
}

async function sendPosthog(event: PickerEvent): Promise<void> {
  const apiKey = readPosthogKey()
  if (!apiKey) {
    console.log("[picker-event][posthog-skip]", JSON.stringify(event))
    return
  }
  const host = readPosthogHost()
  const body = {
    api_key: apiKey,
    event: event.event,
    distinct_id: "rdb-activity-picker",
    properties: {
      input: event.input,
      duration_ms: event.durationMs,
      round: event.round,
      result: event.result,
    },
  }
  await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {})
}

async function dispatch(event: PickerEvent): Promise<void> {
  const provider = readProvider()
  if (provider === "console") {
    console.log("[picker-event]", JSON.stringify(event))
    return
  }
  if (provider === "vercel") {
    await sendVercel(event).catch(() => {})
    return
  }
  await sendPosthog(event).catch(() => {})
}

/**
 * Fire-and-forget analytics. Never throws; never blocks the caller.
 * `ANALYTICS_PROVIDER`: `console` | `vercel` | `posthog` (default `console`).
 * PostHog: `POSTHOG_KEY`; optional `POSTHOG_HOST`. For client-emitted events in Next.js, use the `NEXT_PUBLIC_*` counterparts where needed.
 */
export function logPickerEvent(event: PickerEvent): void {
  try {
    queueMicrotask(() => {
      void dispatch(event)
    })
  } catch {
    // Swallow — analytics must never break the pipeline
  }
}
