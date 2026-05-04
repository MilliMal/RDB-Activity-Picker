"use client"

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { easeOutStrong, transitionUi } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { ActivityCode, Section } from "@/lib/types"

interface ActivityTableProps {
  data: ActivityCode[]
  sections: Section[]
  highlightedCodes: string[]
  open: boolean
  onClose: () => void
  /** When true, skip enter motion (keyboard-opened table; emilkowal `strategy-keyboard-no-animate`). */
  skipEntranceAnimation?: boolean
  /** Called after enter motion finishes (or immediately if skipped); clear `skipEntranceAnimation` upstream. */
  onEntranceAnimationSettled?: () => void
}

type VirtualListItem =
  | {
      type: "section-header"
      section: Section
      rows: Row<ActivityCode>[]
      totalInSection: number
    }
  | {
      type: "row"
      row: Row<ActivityCode>
      sectionTitle: string
    }
  | { type: "hint" }

const HEADER_ESTIMATE_PX = 46
const ROW_ESTIMATE_PX = 44
const HINT_ESTIMATE_PX = 52

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => !el.closest("[aria-hidden='true']"))
}

/** Flex proportions — division gets the most space since it consistently has the longest text. */
const colClass = (id: string) =>
  cn(
    id === "code" && "w-[4.5rem] shrink-0 font-mono",
    id === "section" && "flex-[2] min-w-0",
    id === "division" && "flex-[3] min-w-0",
    id === "activity" && "flex-[2] min-w-0"
  )

export function ActivityTable({
  data,
  sections,
  highlightedCodes,
  open,
  onClose,
  skipEntranceAnimation = false,
  onEntranceAnimationSettled,
}: ActivityTableProps) {
  const [search, setSearch] = useState("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(highlightedCodes.length > 0
      ? data.filter((c) => highlightedCodes.includes(c.code)).map((c) => c.section)
      : []
    )
  )
  const [filterSectionIds, setFilterSectionIds] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()
  const [exitViaKeyboard, setExitViaKeyboard] = useState(false)

  const sectionIdToTitle = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of sections) m.set(s.id, s.title)
    return m
  }, [sections])

  useEffect(() => {
    if (highlightedCodes.length === 0) return
    const sectionsWithHighlights = new Set(
      data
        .filter((c) => highlightedCodes.includes(c.code))
        .map((c) => c.section)
    )
    setExpandedSections((prev) => {
      const next = new Set(prev)
      sectionsWithHighlights.forEach((s) => next.add(s))
      return next
    })
  }, [highlightedCodes, data])

  useEffect(() => {
    if (!open) return

    const previousActive = document.activeElement as HTMLElement | null

    const frame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setExitViaKeyboard(true)
        onClose()
        return
      }

      if (event.key !== "Tab" || !dialogRef.current) return

      const focusables = getFocusableElements(dialogRef.current)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !dialogRef.current.contains(active)) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKeyDown)
      if (previousActive?.focus) {
        previousActive.focus()
      }
    }
  }, [open, onClose])

  /**
   * Instant (0ms) entrances do not reliably invoke `onAnimationComplete`; clear the
   * parent "keyboard entrance" flag on the next frame so later opens animate again.
   */
  useLayoutEffect(() => {
    if (!open || !skipEntranceAnimation || !onEntranceAnimationSettled) return
    const id = requestAnimationFrame(() => {
      onEntranceAnimationSettled()
    })
    return () => cancelAnimationFrame(id)
  }, [open, skipEntranceAnimation, onEntranceAnimationSettled])

  const columns = useMemo<ColumnDef<ActivityCode>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
      },
      {
        id: "section",
        accessorFn: (row) => sectionIdToTitle.get(row.section) ?? row.section,
        header: "Section",
      },
      {
        accessorKey: "division",
        header: "Division",
      },
      {
        accessorKey: "activity",
        header: "Activity",
      },
    ],
    [sectionIdToTitle]
  )

  const filteredData = useMemo(() => {
    let d = data
    if (filterSectionIds.length > 0) {
      d = d.filter((c) => filterSectionIds.includes(c.section))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      d = d.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.activity.toLowerCase().includes(q) ||
          c.division.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q)
      )
    }
    return d
  }, [data, filterSectionIds, search])

  // TanStack Table returns row-model functions that React Compiler cannot safely memoize.
  // eslint-disable-next-line react-hooks/incompatible-library -- known TanStack Table + compiler interaction
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const sectionGroups = useMemo(() => {
    return sections.map((section) => ({
      section,
      rows: table
        .getRowModel()
        .rows.filter((r) => r.original.section === section.id),
      totalInSection: data.filter((c) => c.section === section.id).length,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, table, data, filteredData, sorting])

  const virtualItems = useMemo((): VirtualListItem[] => {
    const items: VirtualListItem[] = []
    for (const { section, rows, totalInSection } of sectionGroups) {
      if (rows.length === 0 && (search || filterSectionIds.length > 0)) {
        continue
      }
      items.push({ type: "section-header", section, rows, totalInSection })
      if (expandedSections.has(section.id)) {
        for (const row of rows) {
          items.push({
            type: "row",
            row,
            sectionTitle:
              sectionIdToTitle.get(row.original.section) ??
              row.original.section,
          })
        }
      }
    }
    if (!search && filterSectionIds.length === 0) {
      items.push({ type: "hint" })
    }
    return items
  }, [
    sectionGroups,
    expandedSections,
    search,
    filterSectionIds,
    sectionIdToTitle,
  ])

  const scrollParentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index]
      if (!item) return ROW_ESTIMATE_PX
      if (item.type === "section-header") return HEADER_ESTIMATE_PX
      if (item.type === "hint") return HINT_ESTIMATE_PX
      return ROW_ESTIMATE_PX
    },
    overscan: 12,
    getItemKey: (index) => {
      const item = virtualItems[index]
      if (!item) return index
      if (item.type === "section-header") return `h-${item.section.id}`
      if (item.type === "row") return `r-${item.row.id}`
      return "hint"
    },
  })

  const [stickySection, setStickySection] = useState<Section | null>(null)

  useEffect(() => {
    const el = scrollParentRef.current
    if (!el || !open) return

    const sectionHeaderIndices = virtualItems
      .map((item, i) => ({ item, i }))
      .filter((x): x is { item: VirtualListItem & { type: "section-header" }; i: number } =>
        x.item.type === "section-header"
      )

    function update() {
      const scrollTop = el!.scrollTop
      let current: Section | null = null
      for (const { item, i } of sectionHeaderIndices) {
        const m = rowVirtualizer.measurementsCache[i]
        const headerStart = m ? m.start : i * HEADER_ESTIMATE_PX
        if (headerStart < scrollTop) current = item.section
      }
      setStickySection(current)
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      el.removeEventListener("scroll", update)
      setStickySection(null)
    }
  }, [open, virtualItems, rowVirtualizer])

  useEffect(() => {
    if (highlightedCodes.length === 0) return
    const code = highlightedCodes[0]
    const index = virtualItems.findIndex(
      (item) => item.type === "row" && item.row.original.code === code
    )
    if (index < 0) return
    const id = requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(index, {
        align: "center",
        behavior: "smooth",
      })
    })
    return () => cancelAnimationFrame(id)
  }, [highlightedCodes, virtualItems, rowVirtualizer])

  const totalVisible = filteredData.length
  const headerGroup = table.getHeaderGroups()[0]

  const keyboardInstantEnter = skipEntranceAnimation && !reduceMotion
  const keyboardInstantExit = exitViaKeyboard && !reduceMotion

  const backdropEnterTransition = reduceMotion
    ? { duration: 0.12, ease: easeOutStrong }
    : keyboardInstantEnter
      ? { duration: 0 }
      : { duration: 0.18, ease: easeOutStrong }

  const panelEnterTransition = reduceMotion
    ? { duration: 0.12, ease: easeOutStrong }
    : keyboardInstantEnter
      ? { duration: 0 }
      : { duration: transitionUi.duration, ease: easeOutStrong }

  const backdropExitTransition = reduceMotion
    ? { duration: 0.1, ease: easeOutStrong }
    : keyboardInstantExit
      ? { duration: 0 }
      : { duration: 0.18, ease: easeOutStrong }

  const panelExitTransition = reduceMotion
    ? { duration: 0.1, ease: easeOutStrong }
    : keyboardInstantExit
      ? { duration: 0 }
      : { duration: transitionUi.duration, ease: easeOutStrong }

  const backdropInitial = reduceMotion
    ? { opacity: 0 }
    : keyboardInstantEnter
      ? false
      : { opacity: 0 }

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : keyboardInstantEnter
      ? false
      : { opacity: 0, y: "1.5%", scale: 0.98 }

  return (
    <>
    <AnimatePresence
      onExitComplete={() => {
        setExitViaKeyboard(false)
      }}
    >
      {open && (
        <motion.div
          key="activity-table-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/75 p-4"
          initial={backdropInitial}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: backdropExitTransition }}
          transition={backdropEnterTransition}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[90vh] min-h-0 w-full max-w-275 min-w-0 flex-col outline-none"
            initial={panelInitial}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduceMotion || keyboardInstantExit ? 0 : "1%",
              scale: reduceMotion || keyboardInstantExit ? 1 : 0.99,
              transition: panelExitTransition,
            }}
            transition={panelEnterTransition}
            style={{ willChange: "transform, opacity" }}
            onClick={(e) => e.stopPropagation()}
          >
        <Card className="flex max-h-[90vh] min-h-0 w-full flex-col overflow-hidden rounded-[20px] border-[#252525] bg-[#111111] text-[#EBEBEB] shadow-2xl">
        <CardHeader className="min-w-0 gap-3 border-b border-[#1E1E1E] bg-[#101010] px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <span
                id={titleId}
                className="text-xl leading-6 font-semibold text-[#EBEBEB]"
              >
                List of codes and Activities
              </span>
              <span className="text-xs whitespace-nowrap text-[#555555]">
                {totalVisible.toLocaleString()} activities across{" "}
                {sections.length} sectors
              </span>
            </div>
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setExitViaKeyboard(false)
                onClose()
              }}
              aria-label="Close dialog"
              className="rounded-[14px] bg-[#2A2A2A] opacity-50 hover:bg-[#333333] hover:opacity-100"
            >
              <XIcon className="size-3 text-[#888888]" aria-hidden />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 basis-[12rem] sm:w-50 sm:flex-none">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#555555]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities..."
                className="h-9 border-[#2A2A2A] bg-[#1C1C1C] pl-8.5 text-[13px] text-[#EBEBEB] placeholder:text-[#444444] focus-visible:border-[#3A3A3A] focus-visible:ring-1 focus-visible:ring-[#3A3A3A]"
              />
            </div>

            <Popover>
              <PopoverTrigger
                type="button"
                className="inline-flex shrink-0 select-none items-center gap-1.5 rounded-[10px] border border-[#2A2A2A] bg-[#1C1C1C] px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-[#EBEBEB] outline-none transition-colors duration-150 ease-out hover:bg-[#252525] hover:text-[#EBEBEB] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
              >
                <SlidersHorizontalIcon className="size-3.5 shrink-0" />
                Filter
                {filterSectionIds.length > 0
                  ? ` · ${filterSectionIds.length}`
                  : ""}
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-64 gap-0 rounded-[12px] border-[#2A2A2A] bg-[#1C1C1C] p-1.5 shadow-xl"
              >
                <div className="max-h-72 overflow-y-auto">
                  {sections.map((s) => {
                    const checked = filterSectionIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-colors duration-100",
                          checked
                            ? "bg-[#1E2E1F] text-[#45C15B]"
                            : "text-[#EBEBEB] hover:bg-[#252525]"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setFilterSectionIds((prev) =>
                              value
                                ? [...prev, s.id]
                                : prev.filter((id) => id !== s.id)
                            )
                          }
                          className={cn(
                            "border-[#555555]",
                            checked && "border-[#45C15B] bg-[#45C15B]"
                          )}
                        />
                        <span className="text-xs leading-[1.4]">{s.title}</span>
                      </label>
                    )
                  })}
                </div>
                {filterSectionIds.length > 0 && (
                  <div className="mt-1 border-t border-[#2A2A2A] pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-[8px] px-2.5 py-1.5 text-left text-xs text-[#888888] hover:bg-[#252525] hover:text-[#EBEBEB]"
                      onClick={() => setFilterSectionIds([])}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
            <div
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col",
                TABLE_SCROLL_MIN_WIDTH
              )}
            >
              {/* Column header stays outside the vertical scroll region so row offsets match @tanstack/virtual */}
              <div className="flex shrink-0 items-center border-b border-[#222222] bg-[#181818] px-7 py-2.5">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <Button
                      type="button"
                      variant="ghost"
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "h-auto justify-start gap-1 rounded-none p-0 text-left text-[11px] font-medium tracking-[0.5px] text-[#555555] uppercase hover:bg-transparent hover:text-[#777777]",
                        columnClassName(header.column.id)
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {sorted === "asc" ? (
                        <ChevronUpIcon className="size-3 shrink-0 text-[#666666]" />
                      ) : sorted === "desc" ? (
                        <ChevronDownIcon className="size-3 shrink-0 text-[#666666]" />
                      ) : (
                        <ChevronsUpDownIcon className="size-3 shrink-0 text-[#555555] opacity-40" />
                      )}
                    </Button>
                  )
                })}
              </div>

              {/* Sticky section header — identical to the virtual section headers so it looks like the row is pinned */}
              {stickySection && (() => {
                const group = sectionGroups.find(g => g.section.id === stickySection.id)
                const isExpanded = expandedSections.has(stickySection.id)
                const rowCount = group ? (group.rows.length > 0 ? group.rows.length : group.totalInSection) : 0
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full shrink-0 justify-start gap-2.5 rounded-none border-b border-[#1E1E1E] bg-[#1A1A1A] px-7 py-2.5 text-left hover:bg-[#202020]"
                    onClick={() => {
                      setExpandedSections((prev) => {
                        const next = new Set(prev)
                        if (next.has(stickySection.id)) next.delete(stickySection.id)
                        else next.add(stickySection.id)
                        return next
                      })
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="size-3.5 shrink-0 text-[#EBEBEB]" />
                    ) : (
                      <ChevronRightIcon className="size-3.5 shrink-0 text-[#444444]" />
                    )}
                    <span className={cn("flex-1 text-xs leading-4 font-semibold", isExpanded ? "text-[#EBEBEB]" : "text-[#555555]")}>
                      {stickySection.title}
                    </span>
                    <span className={cn("text-[11px]", isExpanded ? "text-[#444444]" : "text-[#333333]")}>
                      {rowCount} activities
                    </span>
                  </Button>
                )
              })()}

              <div
                ref={scrollParentRef}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
              >
                <div
                  className="relative w-full"
                  style={{ height: rowVirtualizer.getTotalSize() }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = virtualItems[virtualRow.index]
                    if (!item) return null

                    if (item.type === "section-header") {
                      const { section, rows, totalInSection } = item
                      const isExpanded = expandedSections.has(section.id)
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          className="absolute top-0 left-0 w-full"
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto w-full justify-start gap-2.5 rounded-none border-b border-[#1E1E1E] bg-[#1A1A1A] px-7 py-2.5 text-left hover:bg-[#202020]"
                            onClick={() => {
                              setExpandedSections((prev) => {
                                const next = new Set(prev)
                                if (next.has(section.id)) next.delete(section.id)
                                else next.add(section.id)
                                return next
                              })
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="size-3.5 shrink-0 text-[#EBEBEB]" />
                            ) : (
                              <ChevronRightIcon className="size-3.5 shrink-0 text-[#444444]" />
                            )}
                            <span
                              className={cn(
                                "flex-1 text-xs leading-4 font-semibold",
                                isExpanded ? "text-[#EBEBEB]" : "text-[#555555]"
                              )}
                            >
                              {section.title}
                            </span>
                            <span
                              className={cn(
                                "text-[11px]",
                                isExpanded ? "text-[#444444]" : "text-[#333333]"
                              )}
                            >
                              {rows.length > 0 ? rows.length : totalInSection}{" "}
                              activities
                            </span>
                          </Button>
                        </div>
                      )
                    }

                    if (item.type === "hint") {
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          className="absolute top-0 left-0 w-full"
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div className="px-7 py-3 text-xs text-[#2A2A2A]">
                            Use search or filter to explore all{" "}
                            {data.length.toLocaleString()} activities
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <ActivityRow
                          row={item.row}
                          highlightedCodes={highlightedCodes}
                          sectionTitle={item.sectionTitle}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

function ActivityRow({
  row,
  highlightedCodes,
  sectionTitle,
}: {
  row: Row<ActivityCode>
  highlightedCodes: string[]
  sectionTitle: string
}) {
  const isHighlighted = highlightedCodes.includes(row.original.code)

  return (
    <div
      id={`activity-code-${row.original.code}`}
      className={cn(
        "flex w-full items-center border-b py-2.75 pr-7 pl-13",
        isHighlighted
          ? "border-[#033816] bg-[#12331D]"
          : "border-[#1C1C1C] bg-[#111111]"
      )}
    >
      <span
        className={cn(
          columnClassName("code"),
          "text-[13px] leading-4",
          isHighlighted ? "font-semibold text-[#45C15B]" : "text-[#666666]"
        )}
      >
        {row.original.code}
      </span>
      <span
        className={cn(
          columnClassName("section"),
          "min-w-0 truncate text-[13px] leading-4",
          isHighlighted ? "text-[#ACEAB1]" : "text-[#A3A3A3]"
        )}
        title={sectionTitle}
      >
        {sectionTitle}
      </span>
      <span
        className={cn(
          columnClassName("division"),
          "min-w-0 truncate text-[13px] leading-4",
          isHighlighted ? "text-[#ACEAB1]" : "text-[#888888]"
        )}
        title={row.original.division}
      >
        {row.original.division}
      </span>
      <span
        className={cn(
          columnClassName("activity"),
          "min-w-0 text-[13px] leading-4 break-words",
          isHighlighted ? "text-[#ACEAB1]" : "text-[#EBEBEB]"
        )}
      >
        {row.original.activity}
      </span>
    </div>
  )
}
