import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange?: (date: Date | undefined) => void
  onEndDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Tarih aralığı seçin",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartDateChange?.(undefined)
    onEndDateChange?.(undefined)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <>
              {format(startDate, "dd MMM yyyy")} - {format(endDate, "dd MMM yyyy")}
            </>
          ) : startDate ? (
            format(startDate, "dd MMM yyyy")
          ) : (
            <span>{placeholder}</span>
          )}
          {(startDate || endDate) && (
            <X
              className="ml-auto h-4 w-4"
              onClick={clearDates}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlangıç Tarihi</label>
            <Input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined
                onStartDateChange?.(date)
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitiş Tarihi</label>
            <Input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined
                onEndDateChange?.(date)
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                onStartDateChange?.(today)
                onEndDateChange?.(today)
              }}
            >
              Bugün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                onStartDateChange?.(weekAgo)
                onEndDateChange?.(today)
              }}
            >
              Son 7 Gün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const monthAgo = new Date(today)
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                onStartDateChange?.(monthAgo)
                onEndDateChange?.(today)
              }}
            >
              Son 30 Gün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onStartDateChange?.(undefined)
                onEndDateChange?.(undefined)
                setIsOpen(false)
              }}
            >
              Temizle
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

