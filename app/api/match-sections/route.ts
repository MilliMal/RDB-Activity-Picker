import { streamObject } from "ai"
import { google } from "@ai-sdk/google"
import { buildStep1Prompt } from "@/lib/prompts/step1"
import { step1Schema } from "@/lib/schemas/step1"
import { loadSections } from "@/lib/data/load-sections"
import { logPickerEvent } from "@/lib/analytics"
import { MODEL } from "@/lib/constants"

function durationMsSince(startedAt: unknown): number {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) {
    return 0
  }
  return Math.max(0, Date.now() - startedAt)
}

export async function POST(req: Request) {
  const sections = loadSections()
  const allSectionIds = sections.map((s) => s.id)

  try {
    const body = (await req.json()) as { input?: unknown; startedAt?: unknown }
    const input = typeof body.input === "string" ? body.input.trim() : ""
    if (!input) {
      return Response.json({ sections: allSectionIds })
    }

    const { startedAt } = body

    const result = streamObject({
      model: google(MODEL),
      schema: step1Schema,
      system: buildStep1Prompt(sections),
      prompt: input,
      onFinish: ({ object, error }) => {
        const durationMs = durationMsSince(startedAt)
        const resolvedSections =
          !error && object?.sections?.length
            ? object.sections
            : allSectionIds
        logPickerEvent({
          event: "sections-matched",
          input,
          result: { sections: resolvedSections },
          durationMs,
        })
      },
    })

    return result.toTextStreamResponse()
  } catch {
    return Response.json({ sections: allSectionIds })
  }
}
