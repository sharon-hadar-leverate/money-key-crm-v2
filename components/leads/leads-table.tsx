'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { MoreHorizontal, Search, Eye, Pencil, Trash, Users, Filter, ChevronDown, MessageSquare, Copy, Check } from 'lucide-react'
import { softDeleteLead, updateLeadStatus } from '@/actions/leads'
import { toast } from 'sonner'
import { PIPELINE_STAGES } from '@/types/leads'
import { PIPELINE_LABELS } from '@/lib/status-utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import type { Lead, LeadStatus, PipelineStage } from '@/types/leads'

interface LeadsTableProps {
  leads: Lead[]
  totalCount: number
  initialStage?: PipelineStage
}

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

export function LeadsTable({ leads, totalCount, initialStage }: LeadsTableProps) {
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<PipelineStage | undefined>(initialStage)

  const filteredLeads = useMemo(() =>
    leads.filter((lead) => {
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

      // Stage filter
      if (stageFilter) {
        const stageStatuses = PIPELINE_STAGES[stageFilter] as readonly string[]
        if (!stageStatuses.includes(lead.status as string)) {
          return false
        }
      }

      return true
    }),
    [leads, search, dateRange, stageFilter]
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

          {/* Stage Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="filter-btn">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {stageFilter ? PIPELINE_LABELS[stageFilter] : 'שלב'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white border border-[#E6E9EF] shadow-lg">
              <DropdownMenuItem
                onClick={() => setStageFilter(undefined)}
                className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]"
              >
                הכל
                {!stageFilter && <Check className="h-4 w-4 ms-auto text-[#00A0B0]" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#E6E9EF]" />
              {(Object.keys(PIPELINE_STAGES) as PipelineStage[]).map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]"
                >
                  {PIPELINE_LABELS[stage]}
                  {stageFilter === stage && <Check className="h-4 w-4 ms-auto text-[#00A0B0]" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
                <th>שם</th>
                <th>אימייל</th>
                <th>טלפון</th>
                <th>סטטוס</th>
                <th>מקור</th>
                <th>הכנסה צפויה</th>
                <th>תאריך</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="empty-state">
                      <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-[#9B9BAD]" />
                      </div>
                      <span className="text-[#676879]">לא נמצאו לידים</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`group ${selectedRows.has(lead.id) ? 'bg-[#E5F6F7]' : ''}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="monday-checkbox"
                        checked={selectedRows.has(lead.id)}
                        onChange={() => toggleRowSelection(lead.id)}
                      />
                    </td>
                    <td>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="flex items-center gap-3 group/link"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#00A0B0] flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {lead.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#323338] group-hover/link:text-[#00A0B0] transition-colors">
                            {lead.name}
                          </span>
                          {lead.is_new && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-[#0073EA]" />
                          )}
                          {Boolean((lead.custom_fields as Record<string, unknown> | null)?.zoho_notes) && (
                            <span title="יש הערות מכירה" className="text-[#E07239]">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="text-[#676879]">
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
                    <td className="text-[#676879] tabular-nums" dir="ltr">
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
                    <td>
                      <InlineStatusDropdown
                        lead={lead}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                    <td>
                      {(lead.utm_source || lead.source) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-[#F5F6F8] text-xs text-[#676879]">
                          {lead.utm_source || lead.source}
                        </span>
                      ) : (
                        <span className="text-[#C4C4C4]">-</span>
                      )}
                    </td>
                    <td>
                      <span className="text-[#323338] font-medium number-display">
                        {formatCurrency(lead.expected_revenue)}
                      </span>
                    </td>
                    <td className="text-[#676879] text-sm tabular-nums">
                      {formatDate(lead.created_at)}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
