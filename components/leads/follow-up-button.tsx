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
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (currentFollowUp) {
      const d = new Date(currentFollowUp)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return '10:00'
  })

  const combineDateAndTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined
  }

  const saveFollowUp = async (date: Date | undefined) => {
    setIsUpdating(true)
    try {
      const result = await updateLeadFollowUp(
        leadId,
        date ? date.toISOString() : null
      )
      if (result.success) {
        toast.success(date ? 'תאריך מעקב נקבע' : 'תאריך מעקב הוסר')
        if (!date) setOpen(false)
      } else {
        toast.error(result.error || 'שגיאה בעדכון תאריך המעקב')
      }
    } catch {
      toast.error('שגיאה בעדכון תאריך המעקב')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      await saveFollowUp(undefined)
      return
    }
    const combined = combineDateAndTime(date, selectedTime)
    setSelectedDate(combined)
    await saveFollowUp(combined)
  }

  const handleTimeChange = async (time: string) => {
    setSelectedTime(time)
    if (!selectedDate) return
    const combined = combineDateAndTime(selectedDate, time)
    setSelectedDate(combined)
    await saveFollowUp(combined)
  }

  const handleClear = async () => {
    setSelectedDate(undefined)
    await saveFollowUp(undefined)
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
              {format(selectedDate, 'HH:mm dd/MM/yyyy', { locale: he })}
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
        <div className="px-4 py-3 border-b border-[#E6E9EF] flex items-center gap-2">
          <label htmlFor="follow-up-time" className="text-sm text-[#676879]">שעה:</label>
          <input
            id="follow-up-time"
            type="time"
            value={selectedTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={isUpdating}
            className="px-2 py-1 text-sm border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#00A0B0] text-[#323338]"
          />
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate || new Date()}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
