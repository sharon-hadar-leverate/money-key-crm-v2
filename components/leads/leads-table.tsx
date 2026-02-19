'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { StatusBadge } from './status-badge'
import { LeadAvatar } from './lead-avatar'
import { FollowUpButton } from './follow-up-button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MoreHorizontal, Search, Eye, Pencil, Trash, Users, Filter, ChevronDown, ChevronUp, MessageSquare, Copy, Check, CalendarClock, ArrowUpDown, GripVertical } from 'lucide-react'
import { softDeleteLead, updateLeadStatus, getLeads } from '@/actions/leads'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PIPELINE_STAGES, STATUS_CONFIG } from '@/types/leads'
import { PIPELINE_LABELS } from '@/lib/status-utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { isWithinInterval, parseISO, startOfDay, endOfDay, isPast } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import type { Lead, LeadStatus, PipelineStage } from '@/types/leads'
import { cn } from '@/lib/utils'
import newLeadIcon from '@/app/assets/new_lead_no_bg.png'
import newCustomerIcon from '@/app/assets/new_costumer_no_bg.png'

interface LeadsTableProps {
  leads: Lead[]
  totalCount: number
  initialStage?: PipelineStage
  initialStatuses?: LeadStatus[]
  initialHasFollowUp?: boolean
  noteCounts?: Record<string, number>
}

const PAGE_SIZE = 50

type SortKey = 'name' | 'email' | 'phone' | 'status' | 'source' | 'expected_revenue' | 'follow_up_at' | 'created_at'
type SortDirection = 'asc' | 'desc'

// Inline status dropdown component
function InlineStatusDropdown({
  lead,
  onStatusChange
}: {
  lead: Lead
  onStatusChange: (id: string, status: LeadStatus) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelect = async (status: LeadStatus) => {
    setOpen(false)
    await onStatusChange(lead.id, status)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="cursor-pointer hover:scale-105 transition-transform">
          <StatusBadge status={lead.status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {/* Search filter */}
        <div className="p-2 border-b border-[#E6E9EF]">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9BAD]" />
            <input
              placeholder="חיפוש סטטוס..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pr-8 pl-2 text-sm rounded border border-[#E6E9EF] focus:outline-none focus:border-[#00A0B0]"
            />
          </div>
        </div>
        {/* Status list */}
        <div className="max-h-64 overflow-y-auto">
          {(Object.entries(PIPELINE_STAGES) as [PipelineStage, readonly LeadStatus[]][]).map(([stage, statuses]) => {
            const filteredStatuses = statuses.filter(status => {
              if (!searchQuery) return true
              const config = PIPELINE_LABELS[stage]
              return config.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     status.toLowerCase().includes(searchQuery.toLowerCase())
            })

            if (filteredStatuses.length === 0) return null

            return (
              <div key={stage}>
                <div className="px-3 py-1.5 text-xs font-semibold text-[#9B9BAD] bg-[#F5F6F8] sticky top-0">
                  {PIPELINE_LABELS[stage]}
                </div>
                {filteredStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleSelect(status)}
                    disabled={lead.status === status}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#F5F6F8] disabled:opacity-50 transition-colors"
                  >
                    <StatusBadge status={status} size="sm" />
                    {lead.status === status && <Check className="h-4 w-4 text-[#00A0B0]" />}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function LeadsTable({ leads: initialLeads, totalCount, initialStage, initialStatuses, initialHasFollowUp = false, noteCounts: initialNoteCounts = {} }: LeadsTableProps) {
  // Infinite scroll state
  const [allLeads, setAllLeads] = useState<Lead[]>(initialLeads)
  const [noteCounts] = useState<Record<string, number>>(initialNoteCounts)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialLeads.length < totalCount)
  const [offset, setOffset] = useState(initialLeads.length)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Set<LeadStatus>>(() => {
    // Initialize from initialStatuses or initialStage
    if (initialStatuses && initialStatuses.length > 0) {
      return new Set(initialStatuses)
    }
    if (initialStage) {
      return new Set(PIPELINE_STAGES[initialStage] as unknown as LeadStatus[])
    }
    return new Set()
  })
  const [followUpFilter, setFollowUpFilter] = useState(initialHasFollowUp)
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)
  const [statusSearchQuery, setStatusSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const defaultColumnOrder: SortKey[] = ['name', 'email', 'phone', 'status', 'source', 'expected_revenue', 'follow_up_at', 'created_at']
  const [columnOrder, setColumnOrder] = useState<SortKey[]>(defaultColumnOrder)
  const dragColumnRef = useRef<SortKey | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<SortKey | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortKey(null)
        setSortDirection('asc')
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleColumnDragStart = (key: SortKey) => {
    dragColumnRef.current = key
  }

  const handleColumnDragOver = (e: React.DragEvent, key: SortKey) => {
    e.preventDefault()
    if (dragColumnRef.current && dragColumnRef.current !== key) {
      setDragOverColumn(key)
    }
  }

  const handleColumnDrop = (key: SortKey) => {
    const dragKey = dragColumnRef.current
    if (!dragKey || dragKey === key) {
      dragColumnRef.current = null
      setDragOverColumn(null)
      return
    }
    setColumnOrder(prev => {
      const newOrder = [...prev]
      const fromIndex = newOrder.indexOf(dragKey)
      const toIndex = newOrder.indexOf(key)
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, dragKey)
      return newOrder
    })
    dragColumnRef.current = null
    setDragOverColumn(null)
  }

  const handleColumnDragEnd = () => {
    dragColumnRef.current = null
    setDragOverColumn(null)
  }

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const { data: newLeads } = await getLeads({
        limit: PAGE_SIZE,
        offset,
      })

      if (newLeads.length > 0) {
        setAllLeads(prev => [...prev, ...newLeads])
        setOffset(prev => prev + newLeads.length)
        setHasMore(offset + newLeads.length < totalCount)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more leads:', error)
      toast.error('שגיאה בטעינת לידים נוספים')
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, offset, totalCount])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  const toggleStatus = (status: LeadStatus) => {
    const newFilter = new Set(statusFilter)
    if (newFilter.has(status)) {
      newFilter.delete(status)
    } else {
      newFilter.add(status)
    }
    setStatusFilter(newFilter)
  }

  const clearStatusFilter = () => {
    setStatusFilter(new Set())
  }

  const filteredLeads = useMemo(() => {
    const filtered = allLeads.filter((lead) => {
      // Text search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search)
        if (!matchesSearch) return false
      }

      // Date range filter
      if (dateRange?.from && lead.created_at) {
        const leadDate = parseISO(lead.created_at)
        const from = startOfDay(dateRange.from)
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
        if (!isWithinInterval(leadDate, { start: from, end: to })) {
          return false
        }
      }

      // Multi-select status filter
      if (statusFilter.size > 0) {
        if (!statusFilter.has(lead.status as LeadStatus)) {
          return false
        }
      }

      // Follow-up filter
      if (followUpFilter) {
        if (!lead.follow_up_at) return false
      }

      return true
    })

    const isOverdueFollowUp = (lead: Lead) =>
      lead.follow_up_at ? isPast(new Date(lead.follow_up_at)) : false

    // Always sort overdue follow-ups to the top, then apply user sort within each group
    return [...filtered].sort((a, b) => {
      const overdueA = isOverdueFollowUp(a)
      const overdueB = isOverdueFollowUp(b)

      // Overdue leads always come first
      if (overdueA && !overdueB) return -1
      if (!overdueA && overdueB) return 1

      // Within same group (both overdue or both not), sort by oldest follow-up first if both overdue
      if (overdueA && overdueB) {
        const timeA = new Date(a.follow_up_at!).getTime()
        const timeB = new Date(b.follow_up_at!).getTime()
        if (timeA !== timeB) return timeA - timeB
      }

      // Then apply user sort if active
      if (!sortKey) return 0

      let valA: string | number | null = null
      let valB: string | number | null = null

      switch (sortKey) {
        case 'name':
          valA = a.name?.toLowerCase() ?? ''
          valB = b.name?.toLowerCase() ?? ''
          break
        case 'email':
          valA = a.email?.toLowerCase() ?? ''
          valB = b.email?.toLowerCase() ?? ''
          break
        case 'phone':
          valA = a.phone ?? ''
          valB = b.phone ?? ''
          break
        case 'status':
          valA = a.status ?? ''
          valB = b.status ?? ''
          break
        case 'source':
          valA = (a.utm_source || a.source || '').toLowerCase()
          valB = (b.utm_source || b.source || '').toLowerCase()
          break
        case 'expected_revenue':
          valA = a.expected_revenue ?? 0
          valB = b.expected_revenue ?? 0
          break
        case 'follow_up_at':
          valA = a.follow_up_at ? new Date(a.follow_up_at).getTime() : 0
          valB = b.follow_up_at ? new Date(b.follow_up_at).getTime() : 0
          break
        case 'created_at':
          valA = a.created_at ? new Date(a.created_at).getTime() : 0
          valB = b.created_at ? new Date(b.created_at).getTime() : 0
          break
      }

      if (valA === null && valB === null) return 0
      if (valA === null) return 1
      if (valB === null) return -1

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  },
    [allLeads, search, dateRange, statusFilter, followUpFilter, sortKey, sortDirection]
  )

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    const result = await updateLeadStatus(id, status)
    if (result.success) {
      toast.success('הסטטוס עודכן בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה בעדכון הסטטוס')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הליד?')) return

    const result = await softDeleteLead(id)
    if (result.success) {
      toast.success('הליד נמחק בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה במחיקת הליד')
    }
  }

  const copyToClipboard = (text: string, id: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text)
    setCopiedId(`${id}-${type}`)
    toast.success(type === 'phone' ? 'מספר טלפון הועתק' : 'אימייל הועתק')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const toggleAllRows = () => {
    if (selectedRows.size === filteredLeads.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredLeads.map(l => l.id)))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9BAD]" />
            <input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input w-full sm:w-60"
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-full sm:w-auto">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="טווח תאריכים"
            />
          </div>

          {/* Multi-select Status Filter */}
          <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "filter-btn",
                statusFilter.size > 0 && "border-[#00A0B0] bg-[#E5F6F7]"
              )}>
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {statusFilter.size > 0 ? `סטטוס (${statusFilter.size})` : 'סטטוס'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              {/* Search and clear */}
              <div className="p-2 border-b border-[#E6E9EF] flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9BAD]" />
                  <input
                    placeholder="חיפוש סטטוס..."
                    value={statusSearchQuery}
                    onChange={(e) => setStatusSearchQuery(e.target.value)}
                    className="w-full h-8 pr-8 pl-2 text-sm rounded border border-[#E6E9EF] focus:outline-none focus:border-[#00A0B0]"
                  />
                </div>
                {statusFilter.size > 0 && (
                  <button
                    onClick={clearStatusFilter}
                    className="text-xs text-[#00A0B0] hover:underline whitespace-nowrap"
                  >
                    נקה הכל
                  </button>
                )}
              </div>

              {/* Status list - flat view */}
              <div className="max-h-80 overflow-y-auto p-1">
                {Object.entries(PIPELINE_STAGES).flatMap(([stage, statuses]) => 
                  (statuses as readonly LeadStatus[]).filter(status => {
                    if (!statusSearchQuery) return true
                    const statusLabel = STATUS_CONFIG[status]?.label || status
                    const stageLabel = PIPELINE_LABELS[stage as PipelineStage]
                    return statusLabel.toLowerCase().includes(statusSearchQuery.toLowerCase()) ||
                           stageLabel.toLowerCase().includes(statusSearchQuery.toLowerCase()) ||
                           status.toLowerCase().includes(statusSearchQuery.toLowerCase())
                  })
                ).map((status) => {
                  const config = STATUS_CONFIG[status]
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[#F5F6F8] rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter.has(status)}
                        onChange={() => toggleStatus(status)}
                        className="monday-checkbox"
                      />
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        config?.bgColor || "bg-gray-300"
                      )} />
                      <span className="text-sm text-[#323338]">{config?.label || status}</span>
                    </button>
                  )
                })}
              </div>

              {/* Footer with apply button */}
              <div className="p-2 border-t border-[#E6E9EF] flex justify-end">
                <button
                  onClick={() => setStatusFilterOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#00A0B0] text-white text-sm hover:bg-[#008A99] transition-colors"
                >
                  אישור
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Follow-up filter */}
          <button
            onClick={() => setFollowUpFilter(!followUpFilter)}
            className={cn(
              "filter-btn",
              followUpFilter && "border-[#D17A00] bg-[#FFF0D6] text-[#D17A00]"
            )}
          >
            <CalendarClock className="w-4 h-4" />
            <span className="hidden sm:inline">לחזור בתאריך</span>
          </button>
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-[#00A0B0]" />
          <span className="text-[#323338] font-medium number-display">{filteredLeads.length}</span>
          <span className="text-[#676879]">לידים</span>
          {filteredLeads.length !== totalCount && (
            <span className="text-[#9B9BAD] text-xs">(מתוך {totalCount})</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="monday-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="monday-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    className="monday-checkbox"
                    checked={selectedRows.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleAllRows}
                  />
                </th>
                {columnOrder.map((key) => {
                  const labels: Record<SortKey, string> = {
                    name: 'שם',
                    email: 'אימייל',
                    phone: 'טלפון',
                    status: 'סטטוס',
                    source: 'מקור',
                    expected_revenue: 'הכנסה צפויה',
                    follow_up_at: 'לחזור בתאריך',
                    created_at: 'תאריך',
                  }
                  return (
                    <th
                      key={key}
                      draggable
                      onDragStart={() => handleColumnDragStart(key)}
                      onDragOver={(e) => handleColumnDragOver(e, key)}
                      onDrop={() => handleColumnDrop(key)}
                      onDragEnd={handleColumnDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing select-none",
                        dragOverColumn === key && "bg-[#E5F6F7]"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3 text-[#C4C4C4] shrink-0" />
                        <button
                          onClick={() => handleSort(key)}
                          className="flex items-center gap-1 hover:text-[#00A0B0] transition-colors"
                        >
                          {labels[key]}
                          {sortKey === key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-[#00A0B0]" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-[#00A0B0]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-[#9B9BAD] opacity-0 group-hover/th:opacity-100" />
                          )}
                        </button>
                      </div>
                    </th>
                  )
                })}
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.length + 2} className="text-center py-12">
                    <div className="empty-state">
                      <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-[#9B9BAD]" />
                      </div>
                      <span className="text-[#676879]">לא נמצאו לידים</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const cellRenderers: Record<SortKey, React.ReactNode> = {
                    name: (
                      <td key="name">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="flex items-center gap-3 group/link"
                        >
                          <LeadAvatar lead={lead} size="sm" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#323338] group-hover/link:text-[#00A0B0] transition-colors">
                              {lead.name}
                            </span>
                            {lead.is_new && (
                              <Image src={newLeadIcon} alt="New" width={20} height={20} />
                            )}
                            {lead.status === 'customer' && (
                              <Image src={newCustomerIcon} alt="Customer" width={20} height={20} />
                            )}
                            {(noteCounts[lead.id] ?? 0) > 0 && (
                              <span title={`${noteCounts[lead.id]} הערות`} className="text-[#E07239]">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                    ),
                    email: (
                      <td key="email" className="text-[#676879]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">
                            {lead.email || <span className="text-[#C4C4C4]">-</span>}
                          </span>
                          {lead.email && (
                            <button
                              onClick={() => copyToClipboard(lead.email!, lead.id, 'email')}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#F5F6F8] transition-all"
                              title="העתק אימייל"
                            >
                              {copiedId === `${lead.id}-email` ? (
                                <Check className="h-3.5 w-3.5 text-[#00A0B0]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-[#9B9BAD]" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    ),
                    phone: (
                      <td key="phone" className="text-[#676879] tabular-nums" dir="ltr">
                        <div className="flex items-center gap-2">
                          <span>{lead.phone || <span className="text-[#C4C4C4]">-</span>}</span>
                          {lead.phone && (
                            <button
                              onClick={() => copyToClipboard(lead.phone!, lead.id, 'phone')}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#F5F6F8] transition-all"
                              title="העתק טלפון"
                            >
                              {copiedId === `${lead.id}-phone` ? (
                                <Check className="h-3.5 w-3.5 text-[#00A0B0]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-[#9B9BAD]" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    ),
                    status: (
                      <td key="status">
                        <InlineStatusDropdown
                          lead={lead}
                          onStatusChange={handleStatusChange}
                        />
                      </td>
                    ),
                    source: (
                      <td key="source">
                        {(lead.utm_source || lead.source) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-[#F5F6F8] text-xs text-[#676879]">
                            {lead.utm_source || lead.source}
                          </span>
                        ) : (
                          <span className="text-[#C4C4C4]">-</span>
                        )}
                      </td>
                    ),
                    expected_revenue: (
                      <td key="expected_revenue">
                        <span className="text-[#323338] font-medium number-display">
                          {formatCurrency(lead.expected_revenue)}
                        </span>
                      </td>
                    ),
                    follow_up_at: (
                      <td key="follow_up_at">
                        <FollowUpButton leadId={lead.id} currentFollowUp={lead.follow_up_at ?? null} />
                      </td>
                    ),
                    created_at: (
                      <td key="created_at" className="text-[#676879] text-sm tabular-nums">
                        {formatDate(lead.created_at)}
                      </td>
                    ),
                  }

                  const isOverdue = lead.follow_up_at ? isPast(new Date(lead.follow_up_at)) : false

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        "group",
                        selectedRows.has(lead.id)
                          ? "bg-[#E5F6F7]"
                          : isOverdue
                            ? "bg-[#FFE5E5] hover:bg-[#FFD6D6]"
                            : ""
                      )}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="monday-checkbox"
                          checked={selectedRows.has(lead.id)}
                          onChange={() => toggleRowSelection(lead.id)}
                        />
                      </td>
                      {columnOrder.map((key) => cellRenderers[key])}
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-[#F5F6F8] text-[#676879] hover:text-[#323338] transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E6E9EF] shadow-lg">
                            <DropdownMenuItem asChild className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]">
                              <Link href={`/leads/${lead.id}`} className="flex items-center">
                                <Eye className="h-4 w-4 me-2" />
                                צפייה
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]">
                              <Link href={`/leads/${lead.id}?edit=true`} className="flex items-center">
                                <Pencil className="h-4 w-4 me-2" />
                                עריכה
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E6E9EF]" />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]">
                                שנה סטטוס
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-white border border-[#E6E9EF] shadow-lg max-h-80 overflow-y-auto min-w-[180px]">
                                {(Object.entries(PIPELINE_STAGES) as [PipelineStage, readonly LeadStatus[]][]).map(([stage, statuses]) => (
                                  <div key={stage}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-[#9B9BAD] bg-[#F5F6F8] sticky top-0">
                                      {PIPELINE_LABELS[stage]}
                                    </div>
                                    {statuses.map((status) => (
                                      <DropdownMenuItem
                                        key={status}
                                        onClick={() => handleStatusChange(lead.id, status)}
                                        disabled={lead.status === status}
                                        className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8] flex items-center justify-between"
                                      >
                                        <StatusBadge status={status} size="sm" />
                                        {lead.status === status && <span className="text-[#00A0B0]">✓</span>}
                                      </DropdownMenuItem>
                                    ))}
                                  </div>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator className="bg-[#E6E9EF]" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(lead.id)}
                              className="text-[#D83A52] hover:bg-[#FFD6D9]/30 focus:bg-[#FFD6D9]/30"
                            >
                              <Trash className="h-4 w-4 me-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel and loading indicator */}
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-4"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-[#676879]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">טוען לידים נוספים...</span>
            </div>
          )}
          {!hasMore && allLeads.length > 0 && allLeads.length >= totalCount && (
            <span className="text-sm text-[#9B9BAD]">
              הצגת כל {totalCount} הלידים
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
