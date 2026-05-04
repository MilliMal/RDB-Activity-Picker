"use client"

import { useState } from "react"
import { ExternalLinkIcon, PencilIcon } from "lucide-react"

import { ActivityInput } from "@/components/activity-input"
import { ActivityTable } from "@/components/activity-table"
import { ClarifyCard } from "@/components/clarify-card"
import { EarlyClarifyCard } from "@/components/early-clarify-card"
import { FallbackMessage } from "@/components/fallback-message"
import { MatchResults } from "@/components/match-results"
import { RedirectMessage } from "@/components/redirect-message"
import { RetryLink } from "@/components/retry-link"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MAX_CLARIFY_ROUNDS } from "@/lib/constants"
import { usePickerFlow } from "@/lib/hooks/use-picker-flow"
import type { ActivityCode, Section } from "@/lib/types"

interface PickerClientProps {
  allCodes: ActivityCode[]
  allSections: Section[]
}

export function PickerClient({ allCodes, allSections }: PickerClientProps) {
  const {
    state,
    isStreaming,
    input,
    startedAt,
    editMode,
    clarifyHistory,
    submit,
    selectClarifyOption,
    submitCustomClarify,
    refineEarlyClarify,
    edit,
    retry,
    handleRdbHandoff,
  } = usePickerFlow()

  const [tableOpen, setTableOpen] = useState(false)

  function scrollToTable() {
    setTableOpen(true)
  }

  const showInput =
    state.stage === "idle" || editMode

  const showBubble = Boolean(input) && !showInput && state.stage !== "redirect"

  return (
    <div className="flex min-h-svh flex-col items-center bg-black">
      <div className="flex w-full max-w-138 flex-1 flex-col gap-4 px-4 py-15">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl leading-none tracking-[-0.04em] text-white">
            Find your
            <br />
            business Activities
          </h1>
          <p className="text-base leading-[130%] tracking-[-0.04em] text-[#AAAAAA]">
            Describe what your business does and we&apos;ll match you
            <br />
            to the right official activity codes for registration.
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-7 px-4 py-6">
          {showBubble && (
            <div className="flex items-center justify-end gap-2">
              <div className="max-w-[80%] overflow-hidden rounded-[18px] border border-[#262626]/30 bg-linear-to-br from-[#333333] to-[#1F1F1F] px-3.5 py-2 shadow-sm shadow-black/20">
                <p className="text-[13px] leading-[160%] text-[#EBEBEB]">
                  {input}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={edit}
                aria-label="Edit your description"
                className="rounded-[10px] opacity-50 hover:opacity-100"
              >
                <PencilIcon className="size-4 text-[#808080]" aria-hidden />
              </Button>
            </div>
          )}

          {clarifyHistory.length > 0 && (
            <div className="flex flex-col gap-3">
              {clarifyHistory.map((turn, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="max-w-[85%] self-start rounded-[16px] bg-[#151515] px-3.5 py-2.5">
                    <p className="text-[13px] leading-[160%] text-[#AAAAAA]">
                      {turn.question}
                    </p>
                  </div>
                  <div className="max-w-[80%] self-end rounded-[18px] border border-[#262626]/30 bg-linear-to-br from-[#333333] to-[#1F1F1F] px-3.5 py-2">
                    <p className="text-[13px] leading-[160%] text-[#EBEBEB]">
                      {turn.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isStreaming && (
            <Card className="w-full rounded-[20px] border-0 bg-[#151515] shadow-none">
              <CardContent className="gap-3 p-4">
                <ThinkingIndicator isStreaming={true} startedAt={startedAt} />
              </CardContent>
            </Card>
          )}

          {state.stage === "early-clarify" && (
            <EarlyClarifyCard
              reason={state.question}
              onRefine={refineEarlyClarify}
              startedAt={startedAt}
            />
          )}

          {state.stage === "clarify" && (
            <ClarifyCard
              question={state.question}
              options={state.options}
              onSelect={selectClarifyOption}
              onCustom={submitCustomClarify}
              round={state.round}
              maxRounds={MAX_CLARIFY_ROUNDS}
              startedAt={startedAt}
            />
          )}

          {state.stage === "matched" && (
            <MatchResults
              codes={state.codes}
              businessUnderstanding={state.businessUnderstanding}
              onBrowseTable={scrollToTable}
              onRegister={handleRdbHandoff}
              startedAt={startedAt}
            />
          )}

          {state.stage === "redirect" && (
            <RedirectMessage
              reason={state.reason}
              onRetry={retry}
              onSelectExample={submit}
              examplesDisabled={isStreaming}
              startedAt={startedAt}
            />
          )}

          {(state.stage === "fallback" || state.stage === "error") && (
            <FallbackMessage
              reason={
                state.stage === "error" ? "validation-error" : state.reason
              }
              onBrowseTable={scrollToTable}
              onRetry={retry}
              startedAt={startedAt}
            />
          )}

          {state.stage === "idle" && showInput && (
            <div className="flex w-full flex-col items-center gap-1">
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                <span className="text-sm tracking-[-0.04em] text-[#AAAAAA]">
                  Start by describing your business below, or look at the full
                  list
                </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={scrollToTable}
                  className="h-auto gap-0.5 p-0 text-sm tracking-[-0.04em] text-[#414141] underline underline-offset-2 hover:text-[#777777]"
                >
                  here
                  <ExternalLinkIcon className="size-2" aria-hidden />
                </Button>
              </div>
            </div>
          )}
          {showInput && (
            <ActivityInput
              key={editMode ? `edit-${input}` : "compose"}
              onSubmit={submit}
              disabled={isStreaming}
              defaultValue={editMode ? input : ""}
            />
          )}

          {(state.stage === "matched" ||
            state.stage === "clarify" ||
            state.stage === "early-clarify") && (
            <p className="text-center text-[13px] leading-none text-[#515151]">
              AI can make mistakes. Always verify your selection
              <br />
              using the activity table below.
            </p>
          )}

          {(state.stage === "matched" ||
            state.stage === "clarify" ||
            state.stage === "fallback" ||
            state.stage === "error") && <RetryLink onRetry={retry} />}
        </div>
      </div>

      <ActivityTable
        data={allCodes}
        sections={allSections}
        highlightedCodes={
          state.stage === "matched" ? state.codes.map((c) => c.code) : []
        }
        open={tableOpen}
        onClose={() => setTableOpen(false)}
      />
    </div>
  )
}
