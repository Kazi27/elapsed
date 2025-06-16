"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Calendar, Trash2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FlipDigit } from "@/components/flip-digit"
import { useToast } from "@/hooks/use-toast"

interface TimeSinceTrackerProps {
  id: string
  name: string
  startDate: Date
  onNameChange: (id: string, name: string) => void
  onDateChange: (id: string, date: Date) => void
  onRemove: (id: string) => void
}

export function TimeSinceTracker({ id, name, startDate, onNameChange, onDateChange, onRemove }: TimeSinceTrackerProps) {
  const [elapsed, setElapsed] = useState<{
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Convert 24-hour format to 12-hour format
  const get12HourTime = (date: Date) => {
    let hours = date.getHours()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    return { hours, ampm }
  }

  const { hours: hours12, ampm } = get12HourTime(startDate)
  const [dateTimeFormat, setDateTimeFormat] = useState({
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1, // JavaScript months are 0-indexed
    day: startDate.getDate(),
    hours: hours12,
    minutes: startDate.getMinutes(),
    ampm: ampm,
  })

  useEffect(() => {
    const { hours: newHours12, ampm: newAmPm } = get12HourTime(startDate)
    setDateTimeFormat({
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      day: startDate.getDate(),
      hours: newHours12,
      minutes: startDate.getMinutes(),
      ampm: newAmPm,
    })
  }, [startDate])

  useEffect(() => {
    setEditingName(name)
  }, [name])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()

      // Calculate time units
      const seconds = Math.floor((diff / 1000) % 60)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)

      // Approximate days, months, years
      const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 30)
      const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30)) % 12)
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))

      setElapsed({ years, months, days, hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate])

  const handleEditClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editingName.trim() !== name) {
      onNameChange(id, editingName.trim() || "Untitled")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false)
      if (editingName.trim() !== name) {
        onNameChange(id, editingName.trim() || "Untitled")
      }
    } else if (e.key === "Escape") {
      setEditingName(name)
      setIsEditing(false)
    }
  }

  const updateDateTime = (newDateTime: typeof dateTimeFormat) => {
    // Convert 12-hour format back to 24-hour format
    let hours24 = newDateTime.hours
    if (newDateTime.ampm === "PM" && hours24 < 12) {
      hours24 += 12
    } else if (newDateTime.ampm === "AM" && hours24 === 12) {
      hours24 = 0
    }

    // Create new date
    const newDate = new Date(newDateTime.year, newDateTime.month - 1, newDateTime.day, hours24, newDateTime.minutes, 0)
    onDateChange(id, newDate)
  }

  const formatElapsedTime = () => {
    const parts = []

    if (elapsed.years > 0) {
      parts.push(`${elapsed.years} year${elapsed.years === 1 ? "" : "s"}`)
    }
    if (elapsed.months > 0) {
      parts.push(`${elapsed.months} month${elapsed.months === 1 ? "" : "s"}`)
    }
    if (elapsed.days > 0) {
      parts.push(`${elapsed.days} day${elapsed.days === 1 ? "" : "s"}`)
    }
    if (elapsed.hours > 0) {
      parts.push(`${elapsed.hours} hour${elapsed.hours === 1 ? "" : "s"}`)
    }
    if (elapsed.minutes > 0) {
      parts.push(`${elapsed.minutes} minute${elapsed.minutes === 1 ? "" : "s"}`)
    }

    // Always show seconds if nothing else
    if (parts.length === 0 || elapsed.seconds > 0) {
      parts.push(`${elapsed.seconds} second${elapsed.seconds === 1 ? "" : "s"}`)
    }

    // Join with commas and "and" for the last item
    if (parts.length === 1) {
      return parts[0]
    } else if (parts.length === 2) {
      return parts.join(" and ")
    } else {
      return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1]
    }
  }

  const handleShare = async () => {
    const shareText = `🕐 It's been ${formatElapsedTime()} since "${name}"!\n\nStarted on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}\n\nShared from Time Since ⏰`

    // Check if Web Share API is supported (mainly mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Time Since: ${name}`,
          text: shareText,
        })

        toast({
          title: "Shared successfully!",
          description: "Your tracker has been shared",
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        if ((error as Error).name !== "AbortError") {
          // Fallback to clipboard
          await copyToClipboard(shareText)
        }
      }
    } else {
      // Fallback to clipboard for desktop
      await copyToClipboard(shareText)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard!",
        description: "Share text has been copied. Paste it anywhere to share!",
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      toast({
        title: "Copied to clipboard!",
        description: "Share text has been copied. Paste it anywhere to share!",
      })
    }
  }

  // Generate arrays for dropdowns
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i)
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }
  const days = Array.from({ length: getDaysInMonth(dateTimeFormat.year, dateTimeFormat.month) }, (_, i) => i + 1)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 hover:translate-y-[-4px] hover:border-blue-500/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm w-full">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="font-medium text-lg text-slate-900 dark:text-white"
                placeholder="Enter event name"
              />
            ) : (
              <h2
                className="font-medium text-lg cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-slate-900 dark:text-white"
                onClick={handleEditClick}
              >
                {name}
              </h2>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:scale-110 transition-transform hover:shadow-lg hover:shadow-purple-500/25 hover:border-purple-500/50"
                onClick={handleShare}
                title="Share tracker"
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share tracker</span>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:scale-110 transition-transform hover:shadow-lg hover:shadow-blue-500/25"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="sr-only">Change date and time</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-4 z-[99999]"
                  align="end"
                  side="top"
                  sideOffset={8}
                  avoidCollisions={true}
                  collisionPadding={20}
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-slate-900 dark:text-slate-100">Date</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">Year</label>
                          <Select
                            value={dateTimeFormat.year.toString()}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, year: Number.parseInt(value) }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999] max-h-48">
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">Month</label>
                          <Select
                            value={dateTimeFormat.month.toString()}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, month: Number.parseInt(value) }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]">
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">Day</label>
                          <Select
                            value={dateTimeFormat.day.toString()}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, day: Number.parseInt(value) }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999] max-h-48">
                              {days.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 text-slate-900 dark:text-slate-100">Time</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">Hour</label>
                          <Select
                            value={dateTimeFormat.hours.toString()}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, hours: Number.parseInt(value) }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]">
                              {hours.map((hour) => (
                                <SelectItem key={hour} value={hour.toString()}>
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">
                            Minute
                          </label>
                          <Select
                            value={dateTimeFormat.minutes.toString()}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, minutes: Number.parseInt(value) }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999] max-h-48">
                              {minutes.map((minute) => (
                                <SelectItem key={minute} value={minute.toString()}>
                                  {minute.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1 text-slate-900 dark:text-white">AM/PM</label>
                          <Select
                            value={dateTimeFormat.ampm}
                            onValueChange={(value) => {
                              const newDateTime = { ...dateTimeFormat, ampm: value as "AM" | "PM" }
                              setDateTimeFormat(newDateTime)
                              updateDateTime(newDateTime)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]">
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:border-green-500/50"
                onClick={() => onDateChange(id, new Date())}
                title="Reset timer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                <span className="sr-only">Reset timer</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                onClick={() => onRemove(id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove tracker</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-center gap-3 py-4 overflow-x-auto">
            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.years / 10)} />
                <FlipDigit value={elapsed.years % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">years</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.months / 10)} />
                <FlipDigit value={elapsed.months % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">months</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.days / 10)} />
                <FlipDigit value={elapsed.days % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">days</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.hours / 10)} />
                <FlipDigit value={elapsed.hours % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">hours</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.minutes / 10)} />
                <FlipDigit value={elapsed.minutes % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">minutes</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex">
                <FlipDigit value={Math.floor(elapsed.seconds / 10)} />
                <FlipDigit value={elapsed.seconds % 10} />
              </div>
              <span className="text-xs text-slate-500 mt-1">seconds</span>
            </div>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Started on {startDate.toLocaleDateString()} at{" "}
            {startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
