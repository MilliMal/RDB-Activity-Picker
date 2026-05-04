"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ExternalLinkIcon, PencilIcon } from "lucide-react"

import { ActivityInput } from "@/components/activity-input"
import { ActivityTable } from "@/components/activity-table"
import { ClarifyCard } from "@/components/clarify-card"
import { EarlyClarifyCard } from "@/components/early-clarify-card"
import { FallbackMessage } from "@/components/fallback-message"
import { MatchResults } from "@/components/match-results"
import { RedirectMessage } from "@/components/redirect-message"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { MAX_CLARIFY_ROUNDS } from "@/lib/constants"
import { usePickerFlow } from "@/lib/hooks/use-picker-flow"
import type { ActivityCode, Section, ThinkingSegment } from "@/lib/types"
import type { ThinkingPhase } from "@/components/thinking-indicator"

interface PickerClientProps {
  allCodes: ActivityCode[]
  allSections: Section[]
}

/** Transcript thinking: text only — no panel background (unlike thinking inside the match card). */
function TranscriptThinking({ children }: { children: ReactNode }) {
  return <div className="w-full py-0.5">{children}</div>
}

export function PickerClient({ allCodes, allSections }: PickerClientProps) {
  const {
    state,
    isStreaming,
    input,
    startedAt,
    editMode,
    clarifyHistory,
    initialThinkingSegments,
    clarifyAnswerThinking,
    liveThinking,
    submit,
    selectClarifyOption,
    submitCustomClarify,
    refineEarlyClarify,
    edit,
    retry,
  } = usePickerFlow()

  const [tableOpen, setTableOpen] = useState(false)

  function scrollToTable() {
    setTableOpen(true)
  }

  const showInput =
    state.stage === "idle" || editMode

  /** Clarify prompts + composer stay fixed at the bottom; thinking streams inline in the transcript */
  const showBottomPanel =
    state.stage === "early-clarify" ||
    state.stage === "clarify" ||
    showInput

  const showBubble = Boolean(input) && !showInput && state.stage !== "redirect"

  function renderThinkingSegment(seg: ThinkingSegment, key: string) {
    return (
      <TranscriptThinking key={key}>
        <ThinkingIndicator
          isStreaming={false}
          startedAt={seg.startedAt}
          completedAt={seg.completedAt}
          phase={seg.phase as ThinkingPhase}
        />
      </TranscriptThinking>
    )
  }

  const liveAnchor = liveThinking?.placement
  const liveThinkingInitial =
    liveThinking != null && liveAnchor?.placement === "initial"
  const liveThinkingClarifyIndex =
    liveAnchor?.placement === "clarify" ? liveAnchor.answerIndex : null

  const lastClarifyTurnIdx = clarifyHistory.length - 1

  const showDisclaimer =
    state.stage === "matched" ||
    state.stage === "clarify" ||
    state.stage === "early-clarify"

  return (
    <div className="flex min-h-svh flex-col items-center bg-black">
      <div className="flex w-full max-w-138 flex-1 min-h-0 flex-col">
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-15 ${showBottomPanel ? "pb-4" : "pb-15"}`}
        >
          <div className="flex flex-col gap-4">
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

            <div className="flex flex-col gap-4 px-4 py-6">
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

              {initialThinkingSegments.map((seg, i) =>
                renderThinkingSegment(seg, `init-${i}-${seg.phase}`)
              )}

              {liveThinkingInitial && liveThinking && (
                <TranscriptThinking>
                  <ThinkingIndicator
                    isStreaming={true}
                    startedAt={liveThinking.startedAt}
                    phase={liveThinking.phase as ThinkingPhase}
                  />
                </TranscriptThinking>
              )}

              {clarifyHistory.length > 0 && (
                <div className="flex flex-col gap-4">
                  {clarifyHistory.map((turn, i) => (
                    <div key={i} className="flex flex-col gap-4">
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
                      {!(
                        state.stage === "matched" && i === lastClarifyTurnIdx
                      ) &&
                        (clarifyAnswerThinking[i] ?? []).map((seg, j) =>
                          renderThinkingSegment(
                            seg,
                            `clarify-${i}-${j}-${seg.phase}`
                          )
                        )}
                      {liveThinkingClarifyIndex === i && liveThinking && (
                        <TranscriptThinking>
                          <ThinkingIndicator
                            isStreaming={true}
                            startedAt={liveThinking.startedAt}
                            phase={liveThinking.phase as ThinkingPhase}
                          />
                        </TranscriptThinking>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {state.stage === "clarify" && (
                <div className="max-w-[85%] self-start rounded-[16px] bg-[#151515] px-3.5 py-2.5">
                  <p
                    className="text-[13px] leading-[160%] text-[#AAAAAA]"
                    role="status"
                    aria-live="polite"
                  >
                    {state.question}
                  </p>
                </div>
              )}

              {state.stage === "matched" && (
                <MatchResults
                  codes={state.codes}
                  businessUnderstanding={state.businessUnderstanding}
                  onBrowseTable={scrollToTable}
                  matchPassThinking={
                    lastClarifyTurnIdx >= 0
                      ? (clarifyAnswerThinking[lastClarifyTurnIdx]?.[0] ??
                        null)
                      : null
                  }
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
            </div>
          </div>
        </div>

        {showBottomPanel && (
          <div
            className={`flex shrink-0 flex-col gap-4 bg-black px-4 pt-2 ${showDisclaimer ? "pb-4" : "pb-15"}`}
          >
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
                showQuestionInCard={false}
              />
            )}

            {showInput && (
              <div className="flex flex-col gap-3">
                {state.stage === "idle" && !editMode && (
                  <div className="flex w-full flex-col items-center gap-1">
                    <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                      <span className="text-sm tracking-[-0.04em] text-[#AAAAAA]">
                        Start by describing your business below, or look at the
                        full list
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
                <ActivityInput
                  key={editMode ? `edit-${input}` : "compose"}
                  onSubmit={submit}
                  disabled={isStreaming}
                  defaultValue={editMode ? input : ""}
                />
              </div>
            )}
          </div>
        )}

        {showDisclaimer && (
          <p className="shrink-0 px-4 pb-15 pt-2 text-center text-[13px] leading-none text-[#515151]">
            AI can make mistakes. Always verify your selection
            <br />
            using the activity table below.
          </p>
        )}
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
