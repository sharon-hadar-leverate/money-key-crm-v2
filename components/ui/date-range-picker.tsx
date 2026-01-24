"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { he } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

const PRESETS = [
  { label: "היום", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "אתמול", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "7 ימים", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "30 יום", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "השבוע", getValue: () => ({ from: startOfWeek(new Date(), { locale: he }), to: endOfWeek(new Date(), { locale: he }) }) },
  { label: "החודש", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
] as const

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "בחר טווח תאריכים",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder
    if (!range.to) return format(range.from, "d בMMM yyyy", { locale: he })
    return `${format(range.from, "d בMMM", { locale: he })} - ${format(range.to, "d בMMM yyyy", { locale: he })}`
  }

  const handlePreset = (preset: typeof PRESETS[number]) => {
    onChange?.(preset.getValue())
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.(undefined)
    setOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal h-10 px-3 bg-white border-[#E6E9EF] hover:bg-[#F5F6F8] hover:border-[#00A0B0]",
              !value && "text-[#9B9BAD]"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4 text-[#676879]" />
            <span className="flex-1 truncate">{formatDateRange(value)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* Presets - compact */}
            <div className="border-b sm:border-b-0 sm:border-l border-[#E6E9EF] p-2 space-y-0.5 min-w-[90px]">
              <p className="text-[10px] font-medium text-[#9B9BAD] mb-1 px-1">מהיר</p>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="w-full text-right px-2 py-1 rounded text-xs text-[#323338] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
              {value && (
                <>
                  <div className="border-t border-[#E6E9EF] my-1" />
                  <button
                    onClick={handleClear}
                    className="w-full text-right px-2 py-1 rounded text-xs text-[#D83A52] hover:bg-[#FFD6D9]/30 transition-colors"
                  >
                    נקה
                  </button>
                </>
              )}
            </div>
            {/* Calendar with month/year dropdowns for cross-month selection */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={1}
                captionLayout="dropdown"
                startMonth={new Date(2024, 0)}
                endMonth={new Date(2030, 11)}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
