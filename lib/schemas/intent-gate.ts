import { z } from "zod"
import type { IntentResult } from "@/lib/types"

export const intentGateSchema = z.object({
  type: z.enum(["valid", "vague", "unrelated"]),
  reason: z.string(),
})

type IntentGateSchemaOutput = z.infer<typeof intentGateSchema>

type _IntentSchemaMatchesDomain = IntentResult extends IntentGateSchemaOutput
  ? IntentGateSchemaOutput extends IntentResult
    ? true
    : never
  : never

const _intentTypeCheck: _IntentSchemaMatchesDomain = true
void _intentTypeCheck
