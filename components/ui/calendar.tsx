"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { he } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={he}
      dir="rtl"
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "text-sm font-medium text-[#323338]",
        dropdowns: "flex items-center gap-2",
        dropdown: "appearance-none bg-white border border-[#E6E9EF] rounded-md px-2 py-1 text-sm text-[#323338] hover:border-[#00A0B0] focus:outline-none focus:border-[#00A0B0] cursor-pointer",
        dropdown_root: "relative",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-[#E6E9EF] hover:bg-[#F5F6F8] transition-colors"
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-[#E6E9EF] hover:bg-[#F5F6F8] transition-colors"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-[#9B9BAD] rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-l-md [&:has([aria-selected].day-outside)]:bg-[#F5F6F8]/50 [&:has([aria-selected])]:bg-[#E5F6F7] first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-[#F5F6F8] transition-colors"
        ),
        range_end: "day-range-end",
        selected: "bg-[#00A0B0] text-white hover:bg-[#008A99] hover:text-white focus:bg-[#00A0B0] focus:text-white",
        today: "bg-[#F5F6F8] text-[#323338]",
        outside: "day-outside text-[#C4C4C4] aria-selected:bg-[#F5F6F8]/50 aria-selected:text-[#9B9BAD]",
        disabled: "text-[#C4C4C4]",
        range_middle: "aria-selected:bg-[#E5F6F7] aria-selected:text-[#323338]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronRight className="h-4 w-4" />
          }
          return <ChevronLeft className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
