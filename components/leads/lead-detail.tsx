'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Timeline } from './timeline'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import { Pencil, Save, X, Phone, Mail, Calendar, Wallet, Globe, ExternalLink, User, History, TrendingUp, Percent, MessageSquare, Copy, Check } from 'lucide-react'
import { updateLead, updateLeadStatus } from '@/actions/leads'
import { toast } from 'sonner'
import { STATUS_CONFIG } from '@/types/leads'
import { getStatusPipelineStage, PIPELINE_LABELS, getPipelineStageIndex } from '@/lib/status-utils'
import { cn } from '@/lib/utils'
import type { Lead, LeadEvent, LeadStatus, PipelineStage } from '@/types/leads'

interface LeadDetailProps {
  lead: Lead
  events: LeadEvent[]
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

export function LeadDetail({ lead, events }: LeadDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
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

  // Group statuses by pipeline stage for organized display
  const statusesByStage: Record<PipelineStage, LeadStatus[]> = {
    follow_up: ['new', 'not_contacted', 'no_answer'],
    warm: ['contacted', 'message_sent'],
    hot: ['meeting_set', 'pending_agreement'],
    signed: ['customer', 'signed'],
    lost: ['lost', 'not_relevant', 'closed_elsewhere'],
    future: ['future_interest'],
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Lead Info */}
      <div className="lg:col-span-2 space-y-5">
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

            {/* Status Actions - Grouped by Pipeline Stage */}
            <div className="mt-6 pt-6 border-t border-[#E6E9EF] space-y-3">
              {(Object.keys(statusesByStage) as PipelineStage[]).map((stage) => (
                <div key={stage} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#9B9BAD] w-16 shrink-0">{PIPELINE_LABELS[stage]}:</span>
                  {statusesByStage[stage].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={lead.status === status}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        lead.status === status
                          ? `${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].color} border ${STATUS_CONFIG[status].borderColor || 'border-current'}`
                          : 'bg-[#F5F6F8] text-[#676879] border border-[#E6E9EF] hover:text-[#323338] hover:border-[#00A0B0]'
                      }`}
                    >
                      {STATUS_CONFIG[status].label}
                      {lead.status === status && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              ))}
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

      {/* Timeline */}
      <div>
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
      </div>
    </div>
  )
}
