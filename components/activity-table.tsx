"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ActivityCode, Section } from "@/lib/types"

interface ActivityTableProps {
  data: ActivityCode[]
  sections: Section[]
  highlightedCodes: string[]
  open: boolean
  onClose: () => void
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

/** Min widths keep columns reachable when the table scrolls horizontally inside the modal. */
const TABLE_SCROLL_MIN_WIDTH = "min-w-[680px]"

const columnClassName = (id: string) =>
  cn(
    "shrink-0",
    id === "code" && "w-28 min-w-[7rem] font-mono",
    id === "section" && "w-32 min-w-[8rem]",
    id === "division" && "w-60 min-w-[15rem]",
    id === "activity" && "min-w-[12rem] flex-1"
  )

export function ActivityTable({
  data,
  sections,
  highlightedCodes,
  open,
  onClose,
}: ActivityTableProps) {
  const [search, setSearch] = useState("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.id))
  )
  const [filterSectionIds, setFilterSectionIds] = useState<string[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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
  }, [sections, table, data])

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/75 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] min-h-0 w-full max-w-275 min-w-0 flex-col outline-none"
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
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-[14px] bg-[#2A2A2A] opacity-50 hover:bg-[#333333] hover:opacity-100"
            >
              <XIcon className="size-3 text-[#888888]" aria-hidden />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 max-w-full flex-1 basis-[12rem] items-center gap-2 rounded-[10px] border border-[#2A2A2A] bg-[#1C1C1C] px-3.5 py-2 sm:w-50 sm:flex-none">
              <SearchIcon className="size-3.5 shrink-0 text-[#555555]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities..."
                className="h-auto border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none placeholder:text-[#444444] focus-visible:ring-0"
              />
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilterPanel((p) => !p)}
                className="rounded-[10px] border-[#2A2A2A] bg-[#1C1C1C] px-3.5 py-2 text-[13px] text-[#EBEBEB] hover:bg-[#252525] hover:text-[#EBEBEB]"
              >
                <SlidersHorizontalIcon className="size-3.5 shrink-0" />
                Filter
                {filterSectionIds.length > 0
                  ? ` · ${filterSectionIds.length} sector${filterSectionIds.length > 1 ? "s" : ""}`
                  : ""}
              </Button>

              {showFilterPanel && (
                <Card className="absolute top-full right-0 z-10 mt-1 max-h-75 w-65 overflow-y-auto rounded-[12px] border-[#2A2A2A] bg-[#1C1C1C] p-2 shadow-xl">
                  {sections.map((s) => {
                    const selected = filterSectionIds.includes(s.id)
                    return (
                      <Button
                        key={s.id}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-auto w-full justify-start rounded-[8px] px-2 py-1.5 text-left text-xs text-[#EBEBEB] hover:bg-[#252525] hover:text-[#EBEBEB]",
                          selected && "bg-[#252525] text-[#45C15B]"
                        )}
                        onClick={() => {
                          setFilterSectionIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== s.id)
                              : [...prev, s.id]
                          )
                        }}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full border border-[#555555]",
                            selected && "border-[#45C15B] bg-[#45C15B]"
                          )}
                        />
                        {s.title}
                      </Button>
                    )
                  })}
                  {filterSectionIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-1 h-auto w-full justify-start rounded-[8px] px-2 py-1.5 text-left text-xs text-[#888888] hover:bg-[#252525] hover:text-[#EBEBEB]"
                      onClick={() => setFilterSectionIds([])}
                    >
                      Clear filters
                    </Button>
                  )}
                </Card>
              )}
            </div>
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
      </div>
    </div>
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
