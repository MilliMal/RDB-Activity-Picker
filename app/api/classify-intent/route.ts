import { streamObject } from "ai"
import { google } from "@ai-sdk/google"
import { buildIntentGatePrompt } from "@/lib/prompts/intent-gate"
import { intentGateSchema } from "@/lib/schemas/intent-gate"
import { logPickerEvent } from "@/lib/analytics"
import { MODEL } from "@/lib/constants"

function durationMsSince(startedAt: unknown): number {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) {
    return 0
  }
  return Math.max(0, Date.now() - startedAt)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { input?: unknown; startedAt?: unknown }
    const input = typeof body.input === "string" ? body.input.trim() : ""
    if (!input) {
      return Response.json({ type: "valid" as const, reason: "gate-fallback" })
    }

    const { startedAt } = body

    const result = streamObject({
      model: google(MODEL),
      schema: intentGateSchema,
      system: buildIntentGatePrompt(),
      prompt: input,
      onFinish: ({ object, error }) => {
        const durationMs = durationMsSince(startedAt)
        if (error || !object) {
          logPickerEvent({
            event: "intent-classified",
            input,
            result: { type: "valid", reason: "gate-fallback" },
            durationMs,
          })
          return
        }
        logPickerEvent({
          event: "intent-classified",
          input,
          result: { type: object.type, reason: object.reason },
          durationMs,
        })
        if (object.type === "unrelated") {
          logPickerEvent({
            event: "redirect-shown",
            input,
            result: { reason: object.reason },
            durationMs,
          })
        }
      },
    })

    return result.toTextStreamResponse()
  } catch {
    return Response.json({ type: "valid" as const, reason: "gate-fallback" })
  }
}
