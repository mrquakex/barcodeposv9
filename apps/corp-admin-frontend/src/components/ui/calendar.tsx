import * as React from "react"
import { cn } from "@/lib/utils"

interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  initialFocus?: boolean
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  initialFocus,
}: CalendarProps) {
  // Simple date picker using native input for now
  return (
    <input
      type="date"
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined
        onSelect?.(date)
      }}
      className={cn("rounded-md border p-2", className)}
      autoFocus={initialFocus}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

