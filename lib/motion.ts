/**
 * Shared motion tokens (emilkowal-animations / animations.dev — ease-out default, under 300ms UI).
 * @see https://animations.dev/
 */

export const easeOutStrong = [0.23, 1, 0.32, 1] as const

/** emilkowal `transform-scale-097` — press feedback */
export const pressScale = 0.97

export const ui = {
  /** Fast UI tweens (ms) */
  fastMs: 160,
  /** Standard discrete UI (ms) — skill: ~200ms ease-out */
  standardMs: 200,
} as const

export const transitionUi = {
  duration: ui.standardMs / 1000,
  ease: easeOutStrong,
} as const

export const transitionFast = {
  duration: ui.fastMs / 1000,
  ease: easeOutStrong,
} as const

/** ~150ms ease-out press (skill: scale 0.97 + ~150ms) */
export const pressTapTransition = {
  duration: 0.15,
  ease: easeOutStrong,
} as const
