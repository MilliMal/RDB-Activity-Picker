import { z } from "zod"
import type { Step1Result } from "@/lib/types"

export const step1Schema = z.object({
  sections: z.array(z.string()).min(1),
})

type Step1SchemaOutput = z.infer<typeof step1Schema>

type _Step1SchemaMatchesDomain = Step1Result extends Step1SchemaOutput
  ? Step1SchemaOutput extends Step1Result
    ? true
    : never
  : never

const _step1TypeCheck: _Step1SchemaMatchesDomain = true
void _step1TypeCheck
