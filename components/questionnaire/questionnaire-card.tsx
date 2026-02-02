'use client'

import { cn } from '@/lib/utils'
import {
  FileText,
  Check,
  ChevronLeft,
  Clock,
  Wallet,
  Settings,
  Megaphone,
  TrendingUp,
  Laptop,
  Target,
  UserPlus,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react'
import { CompactProgress } from './questionnaire-progress'
import type { Questionnaire, QuestionnaireResponse, QuestionnaireProgress } from '@/types/questionnaire'

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet,
  Settings,
  Megaphone,
  TrendingUp,
  Laptop,
  Target,
  UserPlus,
  ClipboardCheck,
  FileCheck,
  FileText,
}

interface QuestionnaireCardProps {
  questionnaire: Questionnaire
  response?: QuestionnaireResponse | null
  progress?: QuestionnaireProgress | null
  onClick?: () => void
  compact?: boolean
}

export function QuestionnaireCard({
  questionnaire,
  response,
  progress,
  onClick,
  compact = false,
}: QuestionnaireCardProps) {
  const settings = questionnaire.settings
  const iconName = settings.icon as string | undefined
  const Icon = iconName ? ICON_MAP[iconName] ?? FileText : FileText
  const color = settings.color as string | undefined ?? '#00A0B0'

  const isCompleted = response?.status === 'completed'
  const hasStarted = !!response

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-right",
          isCompleted
            ? "bg-[#D4F4DD]/30 border-[#00854D]/20"
            : hasStarted
            ? "bg-[#FFF8E5]/30 border-[#D17A00]/20"
            : "bg-white border-[#E6E9EF] hover:border-[#00A0B0] hover:shadow-sm"
        )}
      >
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#323338] truncate">
              {questionnaire.name}
            </span>
            {isCompleted && (
              <Check className="w-4 h-4 text-[#00854D] shrink-0" />
            )}
          </div>
          {progress && !isCompleted && (
            <div className="mt-1">
              <CompactProgress progress={progress} />
            </div>
          )}
        </div>

        <ChevronLeft className="w-4 h-4 text-[#9B9BAD] shrink-0" />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border transition-all text-right",
        isCompleted
          ? "bg-[#D4F4DD]/20 border-[#00854D]/20"
          : "bg-white border-[#E6E9EF] hover:border-[#00A0B0] hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#323338]">{questionnaire.name}</h3>
            {isCompleted && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4F4DD] text-[#00854D] text-xs">
                <Check className="w-3 h-3" />
                הושלם
              </span>
            )}
            {hasStarted && !isCompleted && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF8E5] text-[#D17A00] text-xs">
                <Clock className="w-3 h-3" />
                בתהליך
              </span>
            )}
          </div>

          {questionnaire.description && (
            <p className="text-sm text-[#676879] line-clamp-2 mb-3">
              {questionnaire.description}
            </p>
          )}

          {progress && (
            <CompactProgress progress={progress} />
          )}

          {isCompleted && response?.completed_at && (
            <p className="text-xs text-[#9B9BAD] mt-2">
              הושלם ב-{new Date(response.completed_at).toLocaleDateString('he-IL')}
            </p>
          )}
        </div>

        <ChevronLeft className="w-5 h-5 text-[#9B9BAD] shrink-0 mt-1" />
      </div>
    </button>
  )
}

// Empty state for unfilled questionnaires section
export function UnfilledQuestionnairesPlaceholder() {
  return (
    <div className="text-center py-6 text-[#9B9BAD]">
      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">אין שאלונים למילוי</p>
    </div>
  )
}

// Section header for questionnaires
interface QuestionnaireSectionHeaderProps {
  title: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
}

export function QuestionnaireSectionHeader({
  title,
  count,
  icon: HeaderIcon = FileText,
}: QuestionnaireSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <HeaderIcon className="w-4 h-4 text-[#676879]" />
      <h3 className="text-sm font-semibold text-[#323338]">{title}</h3>
      {count !== undefined && (
        <span className="px-1.5 py-0.5 rounded bg-[#F5F6F8] text-xs text-[#676879]">
          {count}
        </span>
      )}
    </div>
  )
}
