import { loadCodes } from "@/lib/data/load-codes"
import { loadSections } from "@/lib/data/load-sections"
import { PickerClient } from "@/components/picker-client"

export default function Page() {
  const allCodes = loadCodes()
  const allSections = loadSections()

  return <PickerClient allCodes={allCodes} allSections={allSections} />
}
