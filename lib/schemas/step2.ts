import { z } from "zod"
import type { Step2Result } from "@/lib/types"

export const step2Schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("match"),
    codes: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
          reason: z.string(),
        })
      )
      .min(1)
      .max(5),
  }),
  z.object({
    type: z.literal("clarify"),
    question: z.string(),
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .min(2)
      .max(4),
  }),
])

type Step2SchemaOutput = z.infer<typeof step2Schema>

/** Runtime output of `step2Schema` — matches {@link Step2Result} (no `fallback`; API uses JSON for that). */
type _Step2SchemaMatchesDomain = Step2Result extends Step2SchemaOutput
  ? Step2SchemaOutput extends Step2Result
    ? true
    : never
  : never

const _step2TypeCheck: _Step2SchemaMatchesDomain = true
void _step2TypeCheck
