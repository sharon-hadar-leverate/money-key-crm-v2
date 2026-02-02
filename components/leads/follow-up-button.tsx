'use client'

import { useState } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { updateLeadFollowUp } from '@/actions/leads'

interface FollowUpButtonProps {
  leadId: string
  currentFollowUp: string | null
}

export function FollowUpButton({ leadId, currentFollowUp }: FollowUpButtonProps) {
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentFollowUp ? new Date(currentFollowUp) : undefined
  )

  const handleSelect = async (date: Date | undefined) => {
    setSelectedDate(date)
    setIsUpdating(true)

    try {
      const result = await updateLeadFollowUp(
        leadId,
        date ? date.toISOString() : null
      )

      if (result.success) {
        toast.success(date ? 'תאריך מעקב נקבע' : 'תאריך מעקב הוסר')
        setOpen(false)
      } else {
        toast.error(result.error || 'שגיאה בעדכון תאריך המעקב')
      }
    } catch {
      toast.error('שגיאה בעדכון תאריך המעקב')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClear = async () => {
    await handleSelect(undefined)
  }

  const hasFollowUp = !!selectedDate

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm",
            hasFollowUp
              ? "bg-[#FFF0D6] border-[#D17A00]/30 text-[#D17A00] hover:bg-[#FFE4B5]"
              : "bg-white border-[#E6E9EF] text-[#676879] hover:border-[#00A0B0] hover:text-[#00A0B0]",
            isUpdating && "opacity-50 cursor-wait"
          )}
          disabled={isUpdating}
        >
          <CalendarClock className="h-4 w-4" />
          {hasFollowUp ? (
            <span className="font-medium">
              {format(selectedDate, 'dd/MM/yyyy', { locale: he })}
            </span>
          ) : (
            <span>לחזור בתאריך</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-[#E6E9EF]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#323338]">
              בחר תאריך מעקב
            </span>
            {hasFollowUp && (
              <button
                onClick={handleClear}
                disabled={isUpdating}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#D83A52] hover:bg-[#FFD6D9] rounded transition-colors"
              >
                <X className="h-3 w-3" />
                נקה
              </button>
            )}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => date < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
