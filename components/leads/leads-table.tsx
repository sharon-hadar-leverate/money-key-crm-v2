'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MoreHorizontal, Search, Eye, Pencil, Trash, Users, Filter, ChevronDown } from 'lucide-react'
import { softDeleteLead, updateLeadStatus } from '@/actions/leads'
import { toast } from 'sonner'
import type { Lead, LeadStatus } from '@/types/leads'

interface LeadsTableProps {
  leads: Lead[]
  totalCount: number
}

export function LeadsTable({ leads, totalCount }: LeadsTableProps) {
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const filteredLeads = useMemo(() =>
    leads.filter((lead) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(search)
      )
    }),
    [leads, search]
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
        <div className="flex items-center gap-3">
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

          {/* Filter button */}
          <button className="filter-btn">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">סינון</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-[#00A0B0]" />
          <span className="text-[#323338] font-medium number-display">{totalCount}</span>
          <span className="text-[#676879]">לידים</span>
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
                    className={selectedRows.has(lead.id) ? 'bg-[#E5F6F7]' : ''}
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
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#00A0B0] flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {lead.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[#323338] group-hover:text-[#00A0B0] transition-colors">
                            {lead.name}
                          </span>
                          {lead.is_new && (
                            <span className="ms-2 inline-flex h-2 w-2 rounded-full bg-[#0073EA]" />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="text-[#676879]">
                      {lead.email || <span className="text-[#C4C4C4]">-</span>}
                    </td>
                    <td className="text-[#676879] tabular-nums" dir="ltr">
                      {lead.phone || <span className="text-[#C4C4C4]">-</span>}
                    </td>
                    <td>
                      <StatusBadge status={lead.status} />
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
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(lead.id, 'contacted')}
                            disabled={lead.status === 'contacted'}
                            className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]"
                          >
                            סמן כנוצר קשר
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(lead.id, 'customer')}
                            disabled={lead.status === 'customer'}
                            className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]"
                          >
                            סמן כלקוח
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(lead.id, 'lost')}
                            disabled={lead.status === 'lost'}
                            className="text-[#323338] hover:bg-[#F5F6F8] focus:bg-[#F5F6F8]"
                          >
                            סמן כאבוד
                          </DropdownMenuItem>
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
