'use client'

import { useState } from 'react'
import { Settings, ChevronLeft, Code, ArrowLeft, EyeOff } from 'lucide-react'
import { STATUS_FLOW, HIDDEN_STATUSES, isHiddenStatus } from '@/lib/status-flow'
import { STATUS_CONFIG, PIPELINE_STAGES, type LeadStatus, type PipelineStage } from '@/types/leads'
import { PIPELINE_LABELS } from '@/lib/status-utils'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[#E5F6F7]">
            <Settings className="h-5 w-5 text-[#00A0B0]" />
          </div>
          <h1 className="text-xl font-bold text-[#323338]">זרימת סטטוסים</h1>
        </div>
        <p className="text-sm text-[#676879]">
          תצוגה ויזואלית של הצעדים הבאים עבור כל סטטוס
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[#9B9BAD]">
          <Code className="h-3.5 w-3.5" />
          <span>לעריכה: <code className="bg-[#F5F6F8] px-1.5 py-0.5 rounded">lib/status-flow.ts</code></span>
        </div>
      </div>

      {/* Hidden Statuses Info */}
      <div className="mb-6 p-4 rounded-lg bg-[#FFF0D6] border border-[#D17A00]/20">
        <div className="flex items-center gap-2 mb-2">
          <EyeOff className="h-4 w-4 text-[#D17A00]" />
          <span className="text-sm font-medium text-[#D17A00]">סטטוסים מוסתרים ({HIDDEN_STATUSES.length})</span>
        </div>
        <p className="text-xs text-[#676879] mb-2">
          הסטטוסים הבאים לא יופיעו בבחירות חדשות (אבל עדיין קיימים בלידים ישנים):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {HIDDEN_STATUSES.map(status => (
            <span key={status} className="text-xs px-2 py-1 rounded bg-white/80 text-[#676879]">
              {STATUS_CONFIG[status]?.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status List */}
        <div className="monday-card p-4">
          <h2 className="text-sm font-semibold text-[#323338] mb-4">בחר סטטוס:</h2>

          <div className="space-y-4">
            {(Object.entries(PIPELINE_STAGES) as [PipelineStage, readonly LeadStatus[]][]).map(([stage, statuses]) => (
              <div key={stage}>
                <div className="text-xs font-medium text-[#9B9BAD] mb-2 px-2">
                  {PIPELINE_LABELS[stage]}
                </div>
                <div className="space-y-1">
                  {[...statuses].map((status) => {
                    const config = STATUS_CONFIG[status as LeadStatus]
                    const isSelected = selectedStatus === status
                    const isHidden = isHiddenStatus(status as LeadStatus)
                    const nextCount = (STATUS_FLOW[status as LeadStatus] || []).filter(s => !isHiddenStatus(s)).length

                    return (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status as LeadStatus)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
                          isSelected
                            ? "bg-[#E5F6F7] border-2 border-[#00A0B0]"
                            : "hover:bg-[#F5F6F8] border-2 border-transparent",
                          isHidden && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", config.bgColor)} />
                          <span className="text-sm text-[#323338]">{config.label}</span>
                          {isHidden && <EyeOff className="h-3 w-3 text-[#9B9BAD]" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#9B9BAD]">
                            {nextCount} צעדים
                          </span>
                          <ChevronLeft className={cn(
                            "h-4 w-4 text-[#9B9BAD] transition-transform",
                            isSelected && "rotate-90 text-[#00A0B0]"
                          )} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps View */}
        <div className="monday-card p-4">
          {selectedStatus ? (
            <>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E6E9EF]">
                <div className={cn("w-4 h-4 rounded-full", STATUS_CONFIG[selectedStatus].bgColor)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#323338]">
                      {STATUS_CONFIG[selectedStatus].label}
                    </h2>
                    {isHiddenStatus(selectedStatus) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFF0D6] text-[#D17A00]">מוסתר</span>
                    )}
                  </div>
                  <p className="text-xs text-[#676879]">צעדים הבאים אפשריים</p>
                </div>
              </div>

              <div className="space-y-2">
                {(STATUS_FLOW[selectedStatus] || []).map((nextStatus, index) => {
                  const config = STATUS_CONFIG[nextStatus]
                  const isHidden = isHiddenStatus(nextStatus)
                  return (
                    <div
                      key={nextStatus}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        isHidden ? "bg-[#FFF0D6]/30" : "bg-[#F5F6F8]"
                      )}
                    >
                      <span className="text-xs text-[#9B9BAD] w-5">{index + 1}.</span>
                      <ArrowLeft className={cn("h-3.5 w-3.5", isHidden ? "text-[#D17A00]" : "text-[#00A0B0]")} />
                      <div className={cn("w-3 h-3 rounded-full", config.bgColor)} />
                      <span className={cn("text-sm", isHidden ? "text-[#9B9BAD]" : "text-[#323338]")}>
                        {config.label}
                      </span>
                      {isHidden && <EyeOff className="h-3 w-3 text-[#D17A00]" />}
                    </div>
                  )
                })}

                {(STATUS_FLOW[selectedStatus] || []).length === 0 && (
                  <div className="text-center py-8 text-sm text-[#9B9BAD]">
                    אין צעדים מוגדרים
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 rounded-full bg-[#F5F6F8] mb-4">
                <ChevronLeft className="h-8 w-8 text-[#9B9BAD]" />
              </div>
              <p className="text-sm text-[#676879]">בחר סטטוס מהרשימה</p>
              <p className="text-xs text-[#9B9BAD] mt-1">לצפייה בצעדים הבאים שלו</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
