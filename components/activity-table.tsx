"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  SearchIcon,
  SlidersHorizontalIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ISICCode, Section } from "@/lib/types"

interface ActivityTableProps {
  data: ISICCode[]
  sections: Section[]
  highlightedCodes: string[]
  open: boolean
  onClose: () => void
}

type FlatVirtualItem =
  | {
      type: "section-header"
      section: Section
      rowsCount: number
      totalInSection: number
      isExpanded: boolean
    }
  | { type: "data"; rowIndexInSection: number; row: Row<ISICCode> }
  | { type: "footer-hint" }

const COL_CODE = 110
const COL_SECTION = 128
const COL_DIVISION = 64

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
  const scrollParentRef = useRef<HTMLDivElement | null>(null)

  const sectionIdToTitle = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of sections) m.set(s.id, s.title)
    return m
  }, [sections])

  // Expand sections that contain highlighted codes
  useEffect(() => {
    if (highlightedCodes.length > 0) {
      const sectionsWithHighlights = new Set(
        data.filter((c) => highlightedCodes.includes(c.code)).map((c) => c.section)
      )
      setExpandedSections((prev) => {
        const next = new Set(prev)
        sectionsWithHighlights.forEach((s) => next.add(s))
        return next
      })
    }
  }, [highlightedCodes, data])

  const columns = useMemo<ColumnDef<ISICCode>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        size: COL_CODE,
      },
      {
        id: "section",
        accessorFn: (row) => sectionIdToTitle.get(row.section) ?? row.section,
        header: "Section",
        size: COL_SECTION,
      },
      {
        accessorKey: "division",
        header: "Division",
        size: COL_DIVISION,
      },
      {
        accessorKey: "description",
        header: "Description",
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
          c.description.toLowerCase().includes(q)
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
    }))
  }, [sections, table])

  const showFooterHint = !search && filterSectionIds.length === 0

  const flatVirtualItems = useMemo((): FlatVirtualItem[] => {
    const out: FlatVirtualItem[] = []
    for (const { section, rows } of sectionGroups) {
      if (rows.length === 0 && (search || filterSectionIds.length > 0)) continue
      const isExpanded = expandedSections.has(section.id)
      const totalInSection = data.filter((c) => c.section === section.id).length
      out.push({
        type: "section-header",
        section,
        rowsCount: rows.length,
        totalInSection,
        isExpanded,
      })
      if (isExpanded) {
        rows.forEach((row, rowIndexInSection) => {
          out.push({ type: "data", row, rowIndexInSection })
        })
      }
    }
    if (showFooterHint) {
      out.push({ type: "footer-hint" })
    }
    return out
  }, [
    sectionGroups,
    expandedSections,
    search,
    filterSectionIds,
    data,
    showFooterHint,
  ])

  const estimateSize = (index: number) => {
    const item = flatVirtualItems[index]
    if (!item) return 46
    if (item.type === "section-header") return 46
    if (item.type === "footer-hint") return 52
    return 46
  }

  const virtualizer = useVirtualizer({
    count: flatVirtualItems.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize,
    overscan: 14,
  })

  const scrollToIndexRef = useRef(virtualizer.scrollToIndex)
  scrollToIndexRef.current = virtualizer.scrollToIndex

  useEffect(() => {
    if (highlightedCodes.length === 0) return
    const idx = flatVirtualItems.findIndex(
      (item) =>
        item.type === "data" &&
        highlightedCodes.includes(item.row.original.code) &&
        item.rowIndexInSection === 0
    )
    if (idx === -1) return
    scrollToIndexRef.current(idx, { align: "center", behavior: "smooth" })
  }, [highlightedCodes, flatVirtualItems])

  const totalVisible = filteredData.length

  const headerGroup = table.getHeaderGroups()[0]

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="flex max-h-[90vh] w-[1100px] max-w-[95vw] flex-col overflow-hidden rounded-[20px]"
        style={{
          backgroundColor: "#111111",
          border: "1px solid #252525",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col gap-3 border-b px-4 py-4"
          style={{ backgroundColor: "#101010", borderColor: "#1E1E1E" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className="text-[20px] font-semibold leading-[24px]"
                style={{ color: "#EBEBEB", fontFamily: "var(--font-sans)" }}
              >
                List of codes and Activities
              </span>
              <span className="text-[12px]" style={{ color: "#555555" }}>
                {totalVisible.toLocaleString()} activities across {sections.length} sectors
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="rounded-[14px] opacity-50 hover:opacity-100"
              style={{ backgroundColor: "#2A2A2A" }}
            >
              <XIcon className="size-3" style={{ color: "#888888" }} />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-[10px] px-3.5 py-2"
              style={{
                backgroundColor: "#1C1C1C",
                border: "1px solid #2A2A2A",
                width: 200,
              }}
            >
              <SearchIcon className="size-3.5 shrink-0" style={{ color: "#555555" }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities..."
                className="h-auto border-0 bg-transparent p-0 text-[13px] text-[#EBEBEB] shadow-none focus-visible:ring-0 placeholder:text-[#444444]"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterPanel((p) => !p)}
                className="flex items-center gap-1.5 rounded-[10px] px-3.5 py-2"
                style={{
                  backgroundColor: "#1C1C1C",
                  border: "1px solid #2A2A2A",
                }}
              >
                <SlidersHorizontalIcon className="size-3.5 shrink-0" style={{ color: "#EBEBEB" }} />
                <span className="text-[13px]" style={{ color: "#EBEBEB" }}>
                  Filter
                  {filterSectionIds.length > 0
                    ? ` · ${filterSectionIds.length} sector${filterSectionIds.length > 1 ? "s" : ""}`
                    : ""}
                </span>
              </button>

              {showFilterPanel && (
                <div
                  className="absolute right-0 top-full z-10 mt-1 max-h-[300px] w-[260px] overflow-y-auto rounded-[12px] p-2"
                  style={{
                    backgroundColor: "#1C1C1C",
                    border: "1px solid #2A2A2A",
                  }}
                >
                  {sections.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 hover:bg-[#252525]"
                    >
                      <input
                        type="checkbox"
                        checked={filterSectionIds.includes(s.id)}
                        onChange={(e) => {
                          setFilterSectionIds((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          )
                        }}
                        className="accent-[#45C15B]"
                      />
                      <span className="text-[12px]" style={{ color: "#EBEBEB" }}>
                        {s.title}
                      </span>
                    </label>
                  ))}
                  {filterSectionIds.length > 0 && (
                    <button
                      type="button"
                      className="mt-1 w-full rounded-[8px] px-2 py-1.5 text-left text-[12px] hover:bg-[#252525]"
                      style={{ color: "#888888" }}
                      onClick={() => setFilterSectionIds([])}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div
          className="flex min-w-0 items-center border-b px-7 py-2.5"
          style={{ backgroundColor: "#181818", borderColor: "#222222" }}
        >
          {headerGroup.headers.map((header) => {
            const sorted = header.column.getIsSorted()
            const w = header.getSize()
            const isDesc = header.column.id === "description"
            return (
              <button
                type="button"
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className={cn(
                  "flex shrink-0 items-center gap-1 text-left text-[11px] font-medium uppercase",
                  isDesc ? "min-w-0 flex-1" : ""
                )}
                style={{
                  color: "#555555",
                  letterSpacing: "0.5px",
                  width: isDesc ? undefined : w,
                  fontFamily: header.column.id === "code" || header.column.id === "division" ? "var(--font-mono)" : undefined,
                }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {sorted === "asc" ? (
                  <ChevronUpIcon className="size-3 shrink-0" style={{ color: "#666666" }} />
                ) : sorted === "desc" ? (
                  <ChevronDownIcon className="size-3 shrink-0" style={{ color: "#666666" }} />
                ) : (
                  <ChevronsUpDownIcon className="size-3 shrink-0 opacity-40" style={{ color: "#555555" }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollParentRef} className="min-h-0 flex-1 overflow-auto">
            <div
              className="relative w-full"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((vRow) => {
                const item = flatVirtualItems[vRow.index]
                if (!item) return null

                if (item.type === "section-header") {
                  const { section, rowsCount, totalInSection, isExpanded } = item
                  return (
                    <div
                      key={`sec-${section.id}`}
                      ref={virtualizer.measureElement}
                      data-index={vRow.index}
                      className="absolute left-0 top-0 w-full"
                      style={{ transform: `translateY(${vRow.start}px)` }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 border-b px-7 py-2.5 text-left"
                        style={{
                          backgroundColor: "#1A1A1A",
                          borderColor: "#1E1E1E",
                        }}
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
                          <ChevronDownIcon className="size-3.5 shrink-0" style={{ color: "#EBEBEB" }} />
                        ) : (
                          <ChevronRightIcon className="size-3.5 shrink-0" style={{ color: "#444444" }} />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-[12px] font-semibold leading-[16px]",
                            isExpanded ? "" : "text-[#555555]"
                          )}
                          style={{ color: isExpanded ? "#EBEBEB" : "#555555" }}
                        >
                          {section.title}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: isExpanded ? "#444444" : "#333333" }}
                        >
                          {rowsCount > 0 ? rowsCount : totalInSection} activities
                        </span>
                      </button>
                    </div>
                  )
                }

                if (item.type === "footer-hint") {
                  return (
                    <div
                      key="footer-hint"
                      ref={virtualizer.measureElement}
                      data-index={vRow.index}
                      className="absolute left-0 top-0 w-full px-7 py-3"
                      style={{ transform: `translateY(${vRow.start}px)` }}
                    >
                      <span className="text-[12px]" style={{ color: "#2A2A2A" }}>
                        Use search or filter to explore all {data.length.toLocaleString()} activities
                      </span>
                    </div>
                  )
                }

                const { row } = item
                const isHighlighted = highlightedCodes.includes(row.original.code)
                const sectionTitle = sectionIdToTitle.get(row.original.section) ?? row.original.section

                return (
                  <div
                    key={row.id}
                    ref={virtualizer.measureElement}
                    data-index={vRow.index}
                    className="absolute left-0 top-0 w-full"
                    style={{ transform: `translateY(${vRow.start}px)` }}
                  >
                    <div
                      className="flex min-w-0 items-center border-b py-[11px] pl-[52px] pr-7"
                      style={{
                        backgroundColor: isHighlighted ? "oklch(23.1% 0.072 149.7)" : "#111111",
                        borderColor: isHighlighted ? "#033816" : "#1C1C1C",
                      }}
                    >
                      <span
                        className={cn(
                          "shrink-0 text-[13px] leading-[16px]",
                          isHighlighted ? "font-semibold" : ""
                        )}
                        style={{
                          width: COL_CODE,
                          color: isHighlighted ? "#45C15B" : "#666666",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {row.original.code}
                      </span>
                      <span
                        className="min-w-0 shrink-0 truncate text-[13px] leading-[16px]"
                        style={{ width: COL_SECTION, color: isHighlighted ? "#ACEAB1" : "#A3A3A3" }}
                        title={sectionTitle}
                      >
                        {sectionTitle}
                      </span>
                      <span
                        className="shrink-0 text-[13px] leading-[16px]"
                        style={{
                          width: COL_DIVISION,
                          color: isHighlighted ? "#ACEAB1" : "#888888",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {row.original.division}
                      </span>
                      <span
                        className="min-w-0 flex-1 text-[13px] leading-[16px]"
                        style={{ color: isHighlighted ? "#ACEAB1" : "#EBEBEB" }}
                      >
                        {row.original.description}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
