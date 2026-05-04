"use client"

import type { ReactNode } from "react"
import { useCallback, useState } from "react"
import { ExternalLinkIcon, PencilIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { ActivityInput } from "@/components/activity-input"
import { ActivityTable } from "@/components/activity-table"
import { ClarifyCard } from "@/components/clarify-card"
import { EarlyClarifyCard } from "@/components/early-clarify-card"
import { FallbackMessage } from "@/components/fallback-message"
import { MatchResults } from "@/components/match-results"
import { RedirectMessage } from "@/components/redirect-message"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import { easeOutStrong } from "@/lib/motion"
import { MAX_CLARIFY_ROUNDS } from "@/lib/constants"
import type { PressInputMode } from "@/lib/use-pointer-press-source"
import { usePointerPressSource } from "@/lib/use-pointer-press-source"
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

  const reduceMotion = useReducedMotion()

  const [tableOpen, setTableOpen] = useState(false)
  const [tableKeyboardEntrance, setTableKeyboardEntrance] = useState(false)

  const browseTable = useCallback((mode: PressInputMode) => {
    setTableKeyboardEntrance(mode === "keyboard")
    setTableOpen(true)
  }, [])

  const tableBrowsePress = usePointerPressSource()

  const showInput = state.stage === "idle" || editMode

  const showBottomPanel =
    state.stage === "early-clarify" ||
    state.stage === "clarify" ||
    showInput

  const showBubble = Boolean(input) && !showInput && state.stage !== "redirect"

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

  // ─── Motion tokens ──────────────────────────────────────────────────────────
  // strategy-purpose-required: every animation serves orientation / feedback.
  // timing-300ms-max: 220ms entrance, 180ms exit — under the 300ms ceiling.
  // props-transform-opacity: only opacity + translateY.
  // polish-reduced-motion: opacity-only fallback when prefers-reduced-motion.

  const dur = reduceMotion ? 0.12 : 0.22
  const exitDur = reduceMotion ? 0.1 : 0.18

  // Feed item: slides up from below to signal "arrival" (strategy-feedback-immediate).
  const feedIn = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "5%" },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "3%" },
    transition: { duration: dur, ease: easeOutStrong },
  }

  // Bottom panel: tighter y — it's anchored to the viewport edge.
  const bottomIn = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "4%" },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "4%" },
    transition: { duration: dur, ease: easeOutStrong },
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Standalone thinking segment (initial pipeline) — gets its own entrance.
   * Do NOT use inside clarify-history turns: the parent motion.div already
   * animates, compounding opacity produces a dimmer-than-intended entrance.
   */
  function renderThinkingSegment(seg: ThinkingSegment, key: string) {
    return (
      <motion.div
        key={key}
        initial={feedIn.initial}
        animate={feedIn.animate}
        exit={feedIn.exit}
        transition={{ duration: exitDur, ease: easeOutStrong }}
      >
        <TranscriptThinking>
          <ThinkingIndicator
            isStreaming={false}
            startedAt={seg.startedAt}
            completedAt={seg.completedAt}
            phase={seg.phase as ThinkingPhase}
          />
        </TranscriptThinking>
      </motion.div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-dvh flex-col items-center bg-black">
      <div className="flex w-full max-w-138 flex-1 min-h-0 flex-col">
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-8 sm:pt-15 ${showBottomPanel ? "pb-4" : "pb-8 sm:pb-15"}`}
        >
          <div className="flex flex-col gap-4">
            {/* Static heading — no animation: strategy-purpose-required */}
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl sm:text-5xl leading-none tracking-[-0.04em] text-white">
                Find your
                <br />
                business Activities
              </h1>
              <p className="text-base leading-[130%] tracking-[-0.04em] text-[#AAAAAA]">
                Describe what your business does and we&apos;ll match you to the right official activity codes for registration.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-4 py-6">

              {/* User bubble — strategy-feedback-immediate: confirms the submit action */}
              <AnimatePresence>
                {showBubble && (
                  <motion.div
                    key="user-bubble"
                    {...feedIn}
                    className="flex items-center justify-end gap-2"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Initial thinking segments — each one arrives independently */}
              {initialThinkingSegments.map((seg, i) =>
                renderThinkingSegment(seg, `init-${i}-${seg.phase}`)
              )}

              {/* Live thinking (initial placement) — exits when streaming ends */}
              <AnimatePresence>
                {liveThinkingInitial && liveThinking && (
                  <motion.div
                    key="live-thinking-initial"
                    initial={feedIn.initial}
                    animate={feedIn.animate}
                    exit={feedIn.exit}
                    transition={{ duration: exitDur, ease: easeOutStrong }}
                  >
                    <TranscriptThinking>
                      <ThinkingIndicator
                        isStreaming={true}
                        startedAt={liveThinking.startedAt}
                        phase={liveThinking.phase as ThinkingPhase}
                      />
                    </TranscriptThinking>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clarify Q&A history — each completed turn slides in as a unit.
                  Thinking segments inside are NOT wrapped separately: parent opacity
                  already animates and compounding would dim them. */}
              {clarifyHistory.length > 0 && (
                <div className="flex flex-col gap-4">
                  {clarifyHistory.map((turn, i) => (
                    <motion.div
                      key={i}
                      initial={feedIn.initial}
                      animate={feedIn.animate}
                      transition={feedIn.transition}
                      className="flex flex-col gap-4"
                    >
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
                        (clarifyAnswerThinking[i] ?? []).map((seg, j) => (
                          <TranscriptThinking key={`clarify-${i}-${j}-${seg.phase}`}>
                            <ThinkingIndicator
                              isStreaming={false}
                              startedAt={seg.startedAt}
                              completedAt={seg.completedAt}
                              phase={seg.phase as ThinkingPhase}
                            />
                          </TranscriptThinking>
                        ))}
                      <AnimatePresence>
                        {liveThinkingClarifyIndex === i && liveThinking && (
                          <motion.div
                            key={`live-clarify-${i}`}
                            initial={feedIn.initial}
                            animate={feedIn.animate}
                            exit={feedIn.exit}
                            transition={{ duration: exitDur, ease: easeOutStrong }}
                          >
                            <TranscriptThinking>
                              <ThinkingIndicator
                                isStreaming={true}
                                startedAt={liveThinking.startedAt}
                                phase={liveThinking.phase as ThinkingPhase}
                              />
                            </TranscriptThinking>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Current clarify question — exits when stage changes */}
              <AnimatePresence>
                {state.stage === "clarify" && (
                  <motion.div
                    key="current-clarify-q"
                    initial={feedIn.initial}
                    animate={feedIn.animate}
                    exit={feedIn.exit}
                    transition={{ duration: exitDur, ease: easeOutStrong }}
                    className="max-w-[85%] self-start rounded-[16px] bg-[#151515] px-3.5 py-2.5"
                  >
                    <p
                      className="text-[13px] leading-[160%] text-[#AAAAAA]"
                      role="status"
                      aria-live="polite"
                    >
                      {state.question}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result cards — strategy-feedback-immediate: the answer arriving */}
              <AnimatePresence>
                {state.stage === "matched" && (
                  <motion.div
                    key="matched"
                    initial={feedIn.initial}
                    animate={feedIn.animate}
                    exit={feedIn.exit}
                    transition={{ duration: exitDur, ease: easeOutStrong }}
                  >
                    <MatchResults
                      codes={state.codes}
                      businessUnderstanding={state.businessUnderstanding}
                      onBrowseTable={browseTable}
                      matchPassThinking={
                        lastClarifyTurnIdx >= 0
                          ? (clarifyAnswerThinking[lastClarifyTurnIdx]?.[0] ??
                            null)
                          : null
                      }
                    />
                  </motion.div>
                )}
                {state.stage === "redirect" && (
                  <motion.div
                    key="redirect"
                    initial={feedIn.initial}
                    animate={feedIn.animate}
                    exit={feedIn.exit}
                    transition={{ duration: exitDur, ease: easeOutStrong }}
                  >
                    <RedirectMessage
                      reason={state.reason}
                      onRetry={retry}
                      onSelectExample={submit}
                      examplesDisabled={isStreaming}
                      startedAt={startedAt}
                    />
                  </motion.div>
                )}
                {(state.stage === "fallback" || state.stage === "error") && (
                  <motion.div
                    key="fallback"
                    initial={feedIn.initial}
                    animate={feedIn.animate}
                    exit={feedIn.exit}
                    transition={{ duration: exitDur, ease: easeOutStrong }}
                  >
                    <FallbackMessage
                      reason={
                        state.stage === "error"
                          ? "validation-error"
                          : state.reason
                      }
                      onBrowseTable={browseTable}
                      onRetry={retry}
                      startedAt={startedAt}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Bottom panel — slides up on entry, slides down on exit.
            interact-interruptible: Framer Motion handles mid-animation reversals. */}
        <AnimatePresence>
          {showBottomPanel && (
            <motion.div
              key="bottom-panel"
              {...bottomIn}
              className={`flex shrink-0 flex-col gap-4 bg-black px-4 pt-2 ${showDisclaimer ? "pb-4" : "pb-8 sm:pb-15"}`}
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
                          {...tableBrowsePress.bind}
                          onClick={tableBrowsePress.wrapClick(browseTable)}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer — opacity-only: it's a footnote, not a content arrival */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.p
              key="disclaimer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur, ease: easeOutStrong }}
              className="shrink-0 px-4 pb-8 sm:pb-15 pt-2 text-center text-[13px] leading-none text-[#515151]"
            >
              AI can make mistakes. Always verify your selection using the activity table below.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ActivityTable
        data={allCodes}
        sections={allSections}
        highlightedCodes={
          state.stage === "matched" ? state.codes.map((c) => c.code) : []
        }
        open={tableOpen}
        skipEntranceAnimation={tableKeyboardEntrance}
        onEntranceAnimationSettled={() => setTableKeyboardEntrance(false)}
        onClose={() => setTableOpen(false)}
      />
    </div>
  )
}
