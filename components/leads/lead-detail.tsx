'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Timeline } from './timeline'
import { NotesSection } from './notes-section'
import { PlaybookPanel } from '@/components/playbooks'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import { Pencil, Save, X, Phone, Mail, Calendar, Wallet, Globe, ExternalLink, User, History, TrendingUp, Percent, MessageSquare, Copy, Check, ChevronDown, Search, FileText } from 'lucide-react'
import { updateLead, updateLeadStatus } from '@/actions/leads'
import { toast } from 'sonner'
import { STATUS_CONFIG, PIPELINE_STAGES } from '@/types/leads'
import { getStatusPipelineStage, PIPELINE_LABELS, getPipelineStageIndex } from '@/lib/status-utils'
import { getQuickActions, getVisibleStatuses } from '@/lib/status-flow'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Lead, LeadEvent, LeadStatus, PipelineStage } from '@/types/leads'
import type { NoteWithUser } from '@/actions/notes'
import type { Playbook } from '@/types/playbooks'

interface LeadDetailProps {
  lead: Lead
  events: LeadEvent[]
  notes?: NoteWithUser[]
  playbooks?: Playbook[]
  currentPlaybook?: Playbook | null
  defaultPlaybookId?: string | null
}

// Pipeline Progress visual indicator
const PROGRESS_STAGES: PipelineStage[] = ['follow_up', 'warm', 'hot', 'signed']

function PipelineProgress({ currentStatus }: { currentStatus: string | null }) {
  const currentStage = getStatusPipelineStage(currentStatus)
  const currentIndex = getPipelineStageIndex(currentStage)

  // Don't show progress for lost/future stages
  if (currentStage === 'lost' || currentStage === 'future') return null

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {PROGRESS_STAGES.map((stage, i) => (
          <div key={stage} className="flex-1 flex items-center gap-1">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= currentIndex ? "bg-[#00A0B0]" : "bg-[#E6E9EF]"
              )}
            />
            {i < PROGRESS_STAGES.length - 1 && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                i < currentIndex ? "bg-[#00A0B0]" : "bg-[#E6E9EF]"
              )} />
            )}
          </div>
        ))}
      </div>
      {/* Stage labels */}
      <div className="flex items-center gap-1 mt-1.5">
        {PROGRESS_STAGES.map((stage, i) => (
          <div key={stage} className="flex-1 flex items-center gap-1">
            <span className={cn(
              "flex-1 text-[10px] text-center",
              i <= currentIndex ? "text-[#00A0B0] font-medium" : "text-[#9B9BAD]"
            )}>
              {PIPELINE_LABELS[stage]}
            </span>
            {i < PROGRESS_STAGES.length - 1 && (
              <div className="w-1.5 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


// Status Selector Component - Clean popover-based UI with Quick Actions
function StatusSelector({
  lead,
  onStatusChange
}: {
  lead: Lead
  onStatusChange: (status: LeadStatus) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [activeTab, setActiveTab] = useState<PipelineStage | null>(null)

  const currentStatus = lead.status as LeadStatus
  const currentStage = getStatusPipelineStage(currentStatus)
  const quickActions = getQuickActions(currentStatus)

  // Set active tab to current stage when opening
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setActiveTab(null) // Start with "all" view
      setSearchQuery('')
    }
  }

  const handleSelect = async (status: LeadStatus) => {
    if (status === currentStatus) return
    setIsChanging(true)
    setOpen(false)
    try {
      await onStatusChange(status)
    } finally {
      setIsChanging(false)
    }
  }

  // Pipeline stage tabs for the popover
  const stageTabs: { key: PipelineStage | null; label: string }[] = [
    { key: null, label: 'הכל' },
    { key: 'follow_up', label: 'מעקב' },
    { key: 'warm', label: 'חמים' },
    { key: 'hot', label: 'חמים מאוד' },
    { key: 'signed', label: 'לקוחות' },
    { key: 'lost', label: 'אבודים' },
    { key: 'future', label: 'עתידי' },
  ]

  // Get statuses to display based on active tab and search (filters out hidden statuses)
  const getFilteredStatuses = () => {
    if (searchQuery) {
      // When searching, search across all visible statuses
      return Object.entries(PIPELINE_STAGES).flatMap(([stage, statuses]) =>
        getVisibleStatuses(statuses as readonly LeadStatus[]).filter((status) => {
          const label = STATUS_CONFIG[status]?.label || status
          const stageLabel = PIPELINE_LABELS[stage as PipelineStage]
          return label.includes(searchQuery) || stageLabel.includes(searchQuery)
        }).map(status => ({ status, stage: stage as PipelineStage }))
      )
    }

    if (activeTab) {
      // When tab is selected, show only visible statuses for that stage
      const stageStatuses = PIPELINE_STAGES[activeTab]
      return getVisibleStatuses(stageStatuses as readonly LeadStatus[]).map(status => ({
        status,
        stage: activeTab
      }))
    }

    // Default: show all grouped by stage
    return null
  }

  const filteredStatuses = getFilteredStatuses()

  return (
    <div className="space-y-4">
      {/* Row 1: Current Status + Stage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#676879]">סטטוס:</span>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            STATUS_CONFIG[currentStatus]?.bgColor || "bg-[#F5F6F8]"
          )}>
            <StatusBadge status={currentStatus} size="md" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#9B9BAD]">שלב:</span>
          <span className={cn(
            "px-2 py-0.5 rounded-md font-medium",
            currentStage === 'lost' ? "bg-[#FFD6D9] text-[#D83A52]" :
            currentStage === 'future' ? "bg-[#D4F4F7] text-[#00A0B0]" :
            currentStage === 'signed' ? "bg-[#D4F4DD] text-[#00854D]" :
            "bg-[#F5F6F8] text-[#676879]"
          )}>
            {PIPELINE_LABELS[currentStage]}
          </span>
        </div>
      </div>

      {/* Row 2: Quick Actions + More Button */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#9B9BAD] shrink-0">צעד הבא:</span>
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              disabled={isChanging}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm",
                "bg-white border-[#E6E9EF] hover:border-[#00A0B0] hover:shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-[#00A0B0]/20",
                isChanging && "opacity-50 cursor-wait"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                STATUS_CONFIG[status]?.bgColor || "bg-gray-200"
              )} />
              <span className="text-[#323338]">{STATUS_CONFIG[status]?.label}</span>
            </button>
          ))}

          {/* "More" Button - Opens Full Popover */}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm",
                  "bg-[#F5F6F8] border-[#E6E9EF] hover:bg-[#ECEDF0] hover:border-[#D0D4DB]",
                  "focus:outline-none focus:ring-2 focus:ring-[#00A0B0]/20",
                  isChanging && "opacity-50 cursor-wait"
                )}
                disabled={isChanging}
              >
                <span className="text-[#676879]">עוד...</span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-[#9B9BAD] transition-transform",
                  open && "rotate-180"
                )} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              {/* Search */}
              <div className="p-3 border-b border-[#E6E9EF]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9BAD]" />
                  <input
                    placeholder="חיפוש סטטוס..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pr-10 pl-3 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/10"
                  />
                </div>
              </div>

              {/* Tabs - Only show when not searching */}
              {!searchQuery && (
                <div className="flex gap-1 p-2 border-b border-[#E6E9EF] bg-[#F9FAFB] overflow-x-auto">
                  {stageTabs.map((tab) => (
                    <button
                      key={tab.key || 'all'}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                        activeTab === tab.key
                          ? "bg-[#00A0B0] text-white"
                          : tab.key === currentStage
                          ? "bg-[#E5F6F7] text-[#00A0B0] hover:bg-[#D4F4F7]"
                          : "text-[#676879] hover:bg-[#ECEDF0]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Status List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredStatuses ? (
                  // Flat list (when tab is selected or searching)
                  <div className="p-1">
                    {filteredStatuses.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[#9B9BAD]">
                        לא נמצאו תוצאות
                      </div>
                    ) : (
                      filteredStatuses.map(({ status, stage }) => (
                        <button
                          key={status}
                          onClick={() => handleSelect(status)}
                          disabled={currentStatus === status}
                          className={cn(
                            "w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors",
                            currentStatus === status
                              ? "bg-[#E5F6F7] cursor-default"
                              : "hover:bg-[#F5F6F8]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <StatusBadge status={status} size="sm" />
                            {searchQuery && (
                              <span className="text-[10px] text-[#9B9BAD]">
                                {PIPELINE_LABELS[stage]}
                              </span>
                            )}
                          </div>
                          {currentStatus === status && (
                            <Check className="h-4 w-4 text-[#00A0B0]" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  // Grouped by stage (default view) - only visible statuses
                  (Object.entries(PIPELINE_STAGES) as [PipelineStage, readonly LeadStatus[]][]).map(([stage, statuses]) => {
                    const visibleStatuses = getVisibleStatuses(statuses)
                    if (visibleStatuses.length === 0) return null
                    return (
                      <div key={stage}>
                        <div className={cn(
                          "px-3 py-2 text-xs font-semibold sticky top-0 flex items-center gap-2",
                          stage === currentStage
                            ? "bg-[#E5F6F7] text-[#00A0B0]"
                            : "bg-[#F5F6F8] text-[#676879]"
                        )}>
                          <span>{PIPELINE_LABELS[stage]}</span>
                          {stage === currentStage && (
                            <span className="text-[10px] font-normal">(נוכחי)</span>
                          )}
                        </div>
                        {visibleStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleSelect(status)}
                            disabled={currentStatus === status}
                            className={cn(
                              "w-full px-3 py-2.5 flex items-center justify-between transition-colors",
                              currentStatus === status
                                ? "bg-[#E5F6F7] cursor-default"
                                : "hover:bg-[#F5F6F8]"
                            )}
                          >
                            <StatusBadge status={status} size="sm" />
                            {currentStatus === status && (
                              <Check className="h-4 w-4 text-[#00A0B0]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

// Tab type
type TabType = 'card' | 'history'

export function LeadDetail({ lead, events, notes = [], playbooks = [], currentPlaybook = null, defaultPlaybookId = null }: LeadDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('card')
  const [formData, setFormData] = useState({
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || '',
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    expected_revenue: lead.expected_revenue?.toString() || '',
    probability: lead.probability?.toString() || '',
  })

  const handleSave = async () => {
    const result = await updateLead({
      id: lead.id,
      ...formData,
      expected_revenue: formData.expected_revenue ? parseFloat(formData.expected_revenue) : undefined,
      probability: formData.probability ? parseInt(formData.probability) : undefined,
    })

    if (result.success) {
      toast.success('הליד עודכן בהצלחה')
      setIsEditing(false)
    } else {
      toast.error(result.error || 'שגיאה בעדכון הליד')
    }
  }

  const handleStatusChange = async (status: LeadStatus) => {
    const result = await updateLeadStatus(lead.id, status)
    if (result.success) {
      toast.success('הסטטוס עודכן בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה בעדכון הסטטוס')
    }
  }

  const copyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone)
      toast.success('מספר טלפון הועתק')
    }
  }

  const copyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email)
      toast.success('אימייל הועתק')
    }
  }

  // Tab configuration
  const tabs = [
    { key: 'card' as TabType, label: 'כרטיס ליד', icon: FileText },
    { key: 'history' as TabType, label: 'היסטוריה', icon: History },
  ]

  return (
    <div className="flex gap-6">
      {/* Playbook Panel - Left Side */}
      {playbooks.length > 0 && (
        <PlaybookPanel
          leadId={lead.id}
          playbooks={playbooks}
          currentPlaybook={currentPlaybook}
          currentPlaybookId={lead.playbook_id ?? null}
          defaultPlaybookId={defaultPlaybookId}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Tabs */}
        <div className="monday-card mb-5">
          <div className="flex border-b border-[#E6E9EF]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative',
                  activeTab === tab.key
                    ? 'text-[#00A0B0]'
                    : 'text-[#676879] hover:text-[#323338]'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A0B0]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'card' ? (
          // Lead Card Content
          <div className="space-y-5">
            {/* Header Card */}
            <div className="monday-card overflow-hidden">
              {/* Teal header */}
              <div className="h-20 bg-gradient-to-r from-[#00A0B0] to-[#00C4B4] relative" />

              <div className="px-6 pb-6 -mt-10 relative">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="w-20 h-20 rounded-xl bg-[#00A0B0] flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-white">
                      {getInitials(lead.name)}
                    </div>
                    <div className="pb-1 flex-1">
                      <h1 className="text-xl font-bold text-[#323338]">{lead.name}</h1>
                      <div className="mt-2 flex items-center gap-3">
                        <StatusBadge status={lead.status} />
                        <span className="text-xs text-[#9B9BAD]">
                          {PIPELINE_LABELS[getStatusPipelineStage(lead.status)]}
                        </span>
                      </div>
                      <PipelineProgress currentStatus={lead.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isEditing
                        ? 'bg-[#F5F6F8] border border-[#E6E9EF] text-[#676879] hover:text-[#323338]'
                        : 'bg-[#00A0B0] text-white hover:bg-[#008A99]'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4" />
                        ביטול
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        עריכה
                      </>
                    )}
                  </button>
                </div>

                {/* Status Selector - Clean, minimal UI */}
                <div className="mt-6 pt-6 border-t border-[#E6E9EF]">
                  <StatusSelector
                    lead={lead}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="monday-card p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-[#CCE5FF]">
                  <User className="h-4 w-4 text-[#0073EA]" />
                </div>
                <h3 className="text-sm font-semibold text-[#323338]">פרטי קשר</h3>
              </div>

              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-[#676879]">שם מלא</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#676879]">אימייל</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#676879]">טלפון</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                      dir="ltr"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-[#F5F6F8] hover:bg-[#ECEDF0] transition-colors group">
                    <div className="p-2 rounded-lg bg-white">
                      <Mail className="h-4 w-4 text-[#676879]" />
                    </div>
                    <span className="text-[#323338] flex-1">{lead.email || <span className="text-[#C4C4C4]">לא צוין</span>}</span>
                    {lead.email && (
                      <button
                        onClick={copyEmail}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                        title="העתק אימייל"
                      >
                        <Copy className="h-4 w-4 text-[#676879]" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-[#F5F6F8] hover:bg-[#ECEDF0] transition-colors group">
                    <div className="p-2 rounded-lg bg-white">
                      <Phone className="h-4 w-4 text-[#676879]" />
                    </div>
                    <span className="text-[#323338] tabular-nums flex-1" dir="ltr">{lead.phone || <span className="text-[#C4C4C4]">לא צוין</span>}</span>
                    {lead.phone && (
                      <button
                        onClick={copyPhone}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                        title="העתק טלפון"
                      >
                        <Copy className="h-4 w-4 text-[#676879]" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-[#F5F6F8] hover:bg-[#ECEDF0] transition-colors">
                    <div className="p-2 rounded-lg bg-white">
                      <Calendar className="h-4 w-4 text-[#676879]" />
                    </div>
                    <span className="text-[#323338]">נוצר: {formatDate(lead.created_at)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Info */}
            <div className="monday-card p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-[#D4F4DD]">
                  <Wallet className="h-4 w-4 text-[#00854D]" />
                </div>
                <h3 className="text-sm font-semibold text-[#323338]">מידע פיננסי</h3>
              </div>

              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-[#676879]">הכנסה צפויה (₪)</label>
                    <input
                      type="number"
                      value={formData.expected_revenue}
                      onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#676879]">הסתברות (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-[#D4F4DD]/30 border border-[#D4F4DD]">
                    <div className="flex items-center gap-2 text-[#676879] text-sm mb-2">
                      <TrendingUp className="w-4 h-4 text-[#00854D]" />
                      הכנסה צפויה
                    </div>
                    <span className="text-xl font-bold text-[#323338] number-display">
                      {formatCurrency(lead.expected_revenue)}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-[#EDD9FB]/30 border border-[#EDD9FB]">
                    <div className="flex items-center gap-2 text-[#676879] text-sm mb-2">
                      <Percent className="w-4 h-4 text-[#9D5BD2]" />
                      הסתברות
                    </div>
                    <span className="text-xl font-bold text-[#323338] number-display">
                      {lead.probability ?? 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Zoho Notes */}
            {(() => {
              const customFields = lead.custom_fields as Record<string, unknown> | null
              const zohoNotes = customFields?.zoho_notes as string | undefined
              if (!zohoNotes) return null
              return (
                <div className="monday-card p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-[#FDEBDC]">
                      <MessageSquare className="h-4 w-4 text-[#E07239]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#323338]">הערות מכירה</h3>
                    <span className="text-xs text-[#9B9BAD] bg-[#F5F6F8] px-2 py-0.5 rounded">Zoho</span>
                  </div>

                  <div className="p-4 rounded-lg bg-[#FDEBDC]/20 border border-[#FDEBDC]">
                    <p className="text-sm text-[#323338] whitespace-pre-wrap leading-relaxed">
                      {zohoNotes}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* UTM Info */}
            {(lead.utm_source || lead.utm_campaign) && (
              <div className="monday-card p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-[#FFF0D6]">
                    <Globe className="h-4 w-4 text-[#D17A00]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#323338]">מידע שיווקי (UTM)</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {lead.utm_source && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F8]">
                      <span className="text-xs text-[#9B9BAD] w-14">מקור:</span>
                      <span className="text-sm text-[#323338]">{lead.utm_source}</span>
                    </div>
                  )}
                  {lead.utm_medium && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F8]">
                      <span className="text-xs text-[#9B9BAD] w-14">מדיום:</span>
                      <span className="text-sm text-[#323338]">{lead.utm_medium}</span>
                    </div>
                  )}
                  {lead.utm_campaign && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F8]">
                      <span className="text-xs text-[#9B9BAD] w-14">קמפיין:</span>
                      <span className="text-sm text-[#323338]">{lead.utm_campaign}</span>
                    </div>
                  )}
                  {lead.landing_page && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F8] sm:col-span-2">
                      <ExternalLink className="h-4 w-4 text-[#9B9BAD]" />
                      <span className="text-sm text-[#323338] truncate">{lead.landing_page}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <NotesSection leadId={lead.id} initialNotes={notes} />

            {isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00A0B0] text-white font-medium hover:bg-[#008A99] transition-all"
                >
                  <Save className="h-4 w-4" />
                  שמור שינויים
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-lg bg-[#F5F6F8] border border-[#E6E9EF] text-[#676879] hover:text-[#323338] transition-all"
                >
                  ביטול
                </button>
              </div>
            )}
          </div>
        ) : (
          // History/Timeline Tab
          <div className="monday-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E9EF]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#EDD9FB]">
                  <History className="h-4 w-4 text-[#9D5BD2]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#323338]">היסטוריית פעולות</h3>
                  <p className="text-xs text-[#9B9BAD]">{events.length} אירועים</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <Timeline events={events} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
