'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createLead } from '@/actions/leads'
import {
  PIPELINE_STAGES,
  STATUS_CONFIG,
  type LeadStatus,
} from '@/types/leads'

const LEAD_SOURCES = [
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'web', label: 'אתר' },
  { value: 'tally', label: 'Tally' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'ישיר', label: 'ישיר' },
  { value: 'הפניה', label: 'הפניה' },
] as const

const STAGE_LABELS: Record<string, string> = {
  follow_up: 'מעקב',
  warm: 'חם',
  signed: 'חתום',
  exit: 'יציאה',
  future: 'עתיד',
}

interface FormData {
  name: string
  phone: string
  email: string
  source: string
  sourceCustom: string
  status: LeadStatus
  first_name: string
  last_name: string
  expected_revenue: string
  probability: string
  refund_amount: string
  commission_rate: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  email: '',
  source: '',
  sourceCustom: '',
  status: 'not_contacted',
  first_name: '',
  last_name: '',
  expected_revenue: '',
  probability: '',
  refund_amount: '',
  commission_rate: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
}

export function CreateLeadForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  function updateField(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('שם הליד הוא שדה חובה')
      return
    }

    startTransition(async () => {
      const resolvedSource = formData.source === 'אחר'
        ? formData.sourceCustom || undefined
        : formData.source || undefined

      const result = await createLead({
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        source: resolvedSource,
        status: formData.status,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        expected_revenue: formData.expected_revenue ? Number(formData.expected_revenue) : undefined,
        probability: formData.probability ? Number(formData.probability) : undefined,
        refund_amount: formData.refund_amount ? Number(formData.refund_amount) : undefined,
        commission_rate: formData.commission_rate ? Number(formData.commission_rate) : undefined,
        utm_source: formData.utm_source || undefined,
        utm_medium: formData.utm_medium || undefined,
        utm_campaign: formData.utm_campaign || undefined,
      })

      if (result.success && result.data) {
        toast.success('הליד נוצר בהצלחה')
        router.push(`/leads/${result.data.id}`)
      } else {
        setError(result.error ?? 'שגיאה ביצירת הליד')
      }
    })
  }

  const inputClassName = 'w-full h-9 px-3 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/10'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-xl border border-[#E6E9EF] shadow-sm">
        <div className="p-6 space-y-4">
          {/* Error message */}
          {error ? (
            <div className="p-3 rounded-lg bg-[#FFD6D9] text-[#D83A52] text-sm">
              {error}
            </div>
          ) : null}

          {/* Name - required */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              שם מלא <span className="text-[#D83A52]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              className={inputClassName}
              placeholder="שם הליד"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              טלפון
            </label>
            <input
              type="tel"
              dir="ltr"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              className={inputClassName}
              placeholder="050-1234567"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              אימייל
            </label>
            <input
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              className={inputClassName}
              placeholder="email@example.com"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              מקור
            </label>
            <select
              value={formData.source}
              onChange={e => {
                updateField('source', e.target.value)
                if (e.target.value !== 'אחר') updateField('sourceCustom', '')
              }}
              className={inputClassName}
            >
              <option value="">בחר מקור...</option>
              {LEAD_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              <option value="אחר">אחר</option>
            </select>
            {formData.source === 'אחר' ? (
              <input
                type="text"
                value={formData.sourceCustom}
                onChange={e => updateField('sourceCustom', e.target.value)}
                className={`${inputClassName} mt-2`}
                placeholder="הזן מקור..."
              />
            ) : null}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              סטטוס
            </label>
            <select
              value={formData.status}
              onChange={e => updateField('status', e.target.value)}
              className={inputClassName}
            >
              {Object.entries(PIPELINE_STAGES).map(([stage, statuses]) => (
                <optgroup key={stage} label={STAGE_LABELS[stage] ?? stage}>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Advanced fields toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-[#0073EA] hover:text-[#0060C0] transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            שדות נוספים
          </button>

          {/* Advanced fields */}
          {showAdvanced ? (
            <div className="space-y-4 pt-2 border-t border-[#E6E9EF]">
              {/* First name / Last name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    שם פרטי
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => updateField('first_name', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    שם משפחה
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => updateField('last_name', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Expected revenue / Probability */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    הכנסה צפויה
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={formData.expected_revenue}
                    onChange={e => updateField('expected_revenue', e.target.value)}
                    className={inputClassName}
                    placeholder="₪"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    סיכוי סגירה (%)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={e => updateField('probability', e.target.value)}
                    className={inputClassName}
                    placeholder="%"
                  />
                </div>
              </div>

              {/* Refund amount / Commission rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    סכום החזר
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={formData.refund_amount}
                    onChange={e => updateField('refund_amount', e.target.value)}
                    className={inputClassName}
                    placeholder="₪"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    אחוז עמלה (%)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={e => updateField('commission_rate', e.target.value)}
                    className={inputClassName}
                    placeholder="%"
                  />
                </div>
              </div>

              {/* UTM fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    UTM Source
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.utm_source}
                    onChange={e => updateField('utm_source', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    UTM Medium
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.utm_medium}
                    onChange={e => updateField('utm_medium', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323338] mb-1">
                    UTM Campaign
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.utm_campaign}
                    onChange={e => updateField('utm_campaign', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E6E9EF] bg-[#F5F6F8] rounded-b-xl">
          <button
            type="submit"
            disabled={isPending}
            className="btn-monday disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'יוצר ליד...' : 'צור ליד'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/leads')}
            className="btn-monday-secondary"
          >
            ביטול
          </button>
        </div>
      </div>
    </form>
  )
}
