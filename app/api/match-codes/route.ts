import { streamObject } from "ai"
import { google } from "@ai-sdk/google"
import { buildStep2Prompt } from "@/lib/prompts/step2"
import { step2Schema } from "@/lib/schemas/step2"
import { loadCodes } from "@/lib/data/load-codes"
import { loadSections } from "@/lib/data/load-sections"
import { filterCodesBySections } from "@/lib/data/filter-codes"
import { resolveSectionIdsForMatching } from "@/lib/data/resolve-section-ids"
import { logPickerEvent } from "@/lib/analytics"
import { MODEL } from "@/lib/constants"

function durationMsSince(startedAt: unknown): number {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) {
    return 0
  }
  return Math.max(0, Date.now() - startedAt)
}

function parseClarifyHistory(
  raw: unknown
): { question: string; answer: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { question: string; answer: string }[] = []
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { question: unknown }).question === "string" &&
      typeof (item as { answer: unknown }).answer === "string"
    ) {
      out.push({
        question: (item as { question: string }).question,
        answer: (item as { answer: string }).answer,
      })
    }
  }
  return out
}

export async function POST(req: Request) {
  let logInput = ""
  let logRound = 0
  let logStartedAt: unknown

  try {
    const body = (await req.json()) as {
      input?: unknown
      sectionIds?: unknown
      clarifyHistory?: unknown
      round?: unknown
      startedAt?: unknown
    }

    const input = typeof body.input === "string" ? body.input.trim() : ""
    logStartedAt = body.startedAt
    const allSectionIds = loadSections().map((s) => s.id)
    const rawSectionIds = Array.isArray(body.sectionIds)
      ? body.sectionIds.filter((id): id is string => typeof id === "string")
      : []
    const sectionIds = resolveSectionIdsForMatching(
      rawSectionIds,
      allSectionIds
    )
    const clarifyHistory = parseClarifyHistory(body.clarifyHistory)
    const round =
      typeof body.round === "number" && Number.isFinite(body.round)
        ? body.round
        : 0
    const { startedAt } = body
    logInput = input
    logRound = round

    if (!input) {
      logPickerEvent({
        event: "fallback-triggered",
        input: "",
        result: { reason: "validation-error", round },
        round,
        durationMs: durationMsSince(startedAt),
      })
      return Response.json({ type: "fallback" as const })
    }

    const allCodes = loadCodes()
    const filtered = filterCodesBySections(sectionIds, allCodes)

    const result = streamObject({
      model: google(MODEL),
      schema: step2Schema,
      system: buildStep2Prompt(filtered, clarifyHistory),
      prompt: input,
      onFinish: ({ object, error }) => {
        const durationMs = durationMsSince(startedAt)
        const ok =
          !error &&
          object &&
          (object.type === "match" || object.type === "clarify")

        if (!ok) {
          logPickerEvent({
            event: "fallback-triggered",
            input,
            result: { reason: "validation-error", round, clarifyHistory },
            round,
            durationMs,
          })
          return
        }

        if (object.type === "match") {
          logPickerEvent({
            event: "codes-matched",
            input,
            result: {
              type: "match" as const,
              businessUnderstanding: object.businessUnderstanding,
              codes: object.codes,
              clarifyHistory,
            },
            round,
            durationMs,
          })
          return
        }

        logPickerEvent({
          event: "clarify-loop",
          input,
          result: {
            type: "clarify" as const,
            question: object.question,
            options: object.options,
            clarifyHistory,
          },
          round,
          durationMs,
        })
      },
    })

    return result.toTextStreamResponse()
  } catch {
    logPickerEvent({
      event: "fallback-triggered",
      input: logInput,
      result: {
        reason: "validation-error",
        round: logRound,
        clarifyHistory: [],
      },
      round: logRound,
      durationMs: durationMsSince(logStartedAt),
    })
    return Response.json({ type: "fallback" as const })
  }
}
