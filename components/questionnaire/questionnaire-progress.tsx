'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { QuestionnaireProgress } from '@/types/questionnaire'

interface QuestionnaireProgressBarProps {
  progress: QuestionnaireProgress
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function QuestionnaireProgressBar({
  progress,
  showDetails = true,
  size = 'md',
}: QuestionnaireProgressBarProps) {
  const { percentage, answered, total, isComplete } = progress

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size]

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className={cn("w-full bg-[#E6E9EF] rounded-full overflow-hidden", heightClass)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isComplete ? "bg-[#00854D]" : "bg-[#00A0B0]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#676879]">
            {answered} מתוך {total} שאלות
          </span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium",
              isComplete ? "text-[#00854D]" : "text-[#00A0B0]"
            )}>
              {percentage}%
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-[#00854D]">
                <Check className="w-3.5 h-3.5" />
                הושלם
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact progress indicator (for cards/lists)
interface CompactProgressProps {
  progress: QuestionnaireProgress
}

export function CompactProgress({ progress }: CompactProgressProps) {
  const { percentage, isComplete } = progress

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#E6E9EF] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isComplete ? "bg-[#00854D]" : "bg-[#00A0B0]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-medium",
        isComplete ? "text-[#00854D]" : "text-[#676879]"
      )}>
        {percentage}%
      </span>
    </div>
  )
}
