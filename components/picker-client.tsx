"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { usePickerFlow } from "@/lib/hooks/use-picker-flow"
import { ActivityInput } from "@/components/activity-input"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { ClarifyCard } from "@/components/clarify-card"
import { EarlyClarifyCard } from "@/components/early-clarify-card"
import { MatchResults } from "@/components/match-results"
import { ActivityTable } from "@/components/activity-table"
import { RedirectMessage } from "@/components/redirect-message"
import { FallbackMessage } from "@/components/fallback-message"
import { RetryLink } from "@/components/retry-link"
import { Button } from "@/components/ui/button"
import { MAX_CLARIFY_ROUNDS } from "@/lib/constants"
import type { ISICCode, Section } from "@/lib/types"

interface PickerClientProps {
  allCodes: ISICCode[]
  allSections: Section[]
}

export function PickerClient({ allCodes, allSections }: PickerClientProps) {
  const {
    state,
    isStreaming,
    input,
    startedAt,
    editMode,
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
    state.stage === "idle" ||
    state.stage === "checking" ||
    state.stage === "classifying" ||
    state.stage === "matching-sections" ||
    state.stage === "matching-codes" ||
    editMode

  const showBubble =
    Boolean(input) &&
    !showInput &&
    state.stage !== "redirect"

  return (
    <div
      className="flex min-h-svh flex-col items-center"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Main content */}
      <div
        className="flex w-full max-w-[552px] flex-1 flex-col gap-4 px-4 py-[60px]"
      >
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <h1
            className="text-[48px] leading-none"
            style={{
              color: "#FFFFFF",
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.04em",
            }}
          >
            Find your
            <br />
            business Activities
          </h1>
          <p
            className="text-[16px] leading-[130%]"
            style={{ color: "#AAAAAA", letterSpacing: "-0.04em" }}
          >
            Describe what your business does and we&apos;ll match you
            <br />
            to the right official activity codes for registration.
          </p>
        </div>

        {/* Spacer for visual layout matching design */}
        <div className="flex flex-1 flex-col justify-end gap-7 py-6 px-4">

          {/* User bubble + edit */}
          {showBubble && (
            <div className="flex items-center justify-end gap-2">
              <div
                className="max-w-[80%] overflow-hidden rounded-full px-3.5 py-2"
                style={{
                  background: "linear-gradient(135deg in oklab, oklab(26% 0 0) 0%, oklab(16.5% 0 0) 100%)",
                  border: "1px solid rgba(38,38,38,0.3)",
                  boxShadow: "rgba(255,255,255,0.04) 0px 1px 0px inset, rgba(0,0,0,0.2) 0px 1px 2px",
                }}
              >
                <p className="text-[13px] leading-[160%]" style={{ color: "#EBEBEB" }}>
                  {input}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={edit}
                className="rounded-[10px] opacity-50 hover:opacity-100"
              >
                <PencilIcon className="size-4" style={{ color: "#808080" }} />
              </Button>
            </div>
          )}

          {/* Streaming / thinking */}
          {isStreaming && (
            <ThinkingIndicator isStreaming={true} startedAt={startedAt} />
          )}

          {/* State-dependent content */}
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
              reason={state.stage === "error" ? "validation-error" : state.reason}
              onBrowseTable={scrollToTable}
              onRetry={retry}
              startedAt={startedAt}
            />
          )}

          {/* Compose — Paper: intro line above input, then field, then tip (tip lives in ActivityInput) */}
          {state.stage === "idle" && showInput && (
            <div className="flex w-full flex-col items-center gap-1">
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                <span
                  className="text-[14px]"
                  style={{ color: "#AAAAAA", letterSpacing: "-0.04em" }}
                >
                  Start by describing your business below, or look at the full list
                </span>
                <button
                  type="button"
                  onClick={scrollToTable}
                  className="inline-flex items-center gap-0.5 text-[14px] underline underline-offset-2"
                  style={{ color: "#414141", letterSpacing: "-0.04em" }}
                >
                  here
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2 10L10 2M10 2H5M10 2V7"
                      stroke="#414141"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
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

          {/* Disclaimer */}
          {(state.stage === "matched" ||
            state.stage === "clarify" ||
            state.stage === "early-clarify") && (
            <p
              className="text-center text-[13px] leading-none"
              style={{ color: "#515151" }}
            >
              AI can make mistakes. Always verify your selection
              <br />
              using the activity table below.
            </p>
          )}

          {/* Retry link */}
          {(state.stage === "matched" ||
            state.stage === "clarify" ||
            state.stage === "fallback" ||
            state.stage === "error") && <RetryLink onRetry={retry} />}
        </div>
      </div>

      {/* Activity table modal */}
      <ActivityTable
        data={allCodes}
        sections={allSections}
        highlightedCodes={state.stage === "matched" ? state.codes.map((c) => c.code) : []}
        open={tableOpen}
        onClose={() => setTableOpen(false)}
      />
    </div>
  )
}
