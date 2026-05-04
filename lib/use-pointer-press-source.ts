import { useCallback, useRef } from "react"

/** How the user activated a press target (emilkowal: keyboard-initiated UI should not animate). */
export type PressInputMode = "pointer" | "keyboard"

/**
 * Tracks whether the last activation used a pointer (mouse/touch/pen) vs keyboard,
 * so callers can skip motion on keyboard-initiated opens/toggles.
 */
export function usePointerPressSource() {
  const fromPointerRef = useRef(false)

  const markFromPointer = useCallback(() => {
    fromPointerRef.current = true
  }, [])

  const onPointerDown = markFromPointer
  /** `mousedown` / `touchstart` cover cases where `pointerdown` does not fire before `click`. */
  const onMouseDown = markFromPointer
  const onTouchStart = markFromPointer

  const onBlur = useCallback(() => {
    fromPointerRef.current = false
  }, [])

  const wrapClick = useCallback(
    (fn: (mode: PressInputMode) => void) => () => {
      const mode: PressInputMode = fromPointerRef.current
        ? "pointer"
        : "keyboard"
      fromPointerRef.current = false
      fn(mode)
    },
    []
  )

  const bind = { onBlur, onMouseDown, onPointerDown, onTouchStart }
  return { ...bind, bind, wrapClick }
}
