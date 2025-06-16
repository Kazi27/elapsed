"use client"

import { useEffect, useState } from "react"

interface FlipDigitProps {
  value: number
}

export function FlipDigit({ value }: FlipDigitProps) {
  const [currentValue, setCurrentValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (value !== currentValue) {
      setPreviousValue(currentValue)
      setCurrentValue(value)
      setIsFlipping(true)

      const timer = setTimeout(() => {
        setIsFlipping(false)
      }, 500) // Match this with the CSS animation duration

      return () => clearTimeout(timer)
    }
  }, [value, currentValue])

  return (
    <div className="flip-digit-container relative mx-0.5 w-10 h-16 perspective-500">
      <div
        className={`flip-card relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipping ? "animate-flip" : ""}`}
      >
        {/* Top half (current value) */}
        <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-md flex items-center justify-center text-2xl font-mono font-bold shadow-lg shadow-slate-900/20 overflow-hidden border border-slate-600/30">
          <span className="drop-shadow-lg">{currentValue}</span>
        </div>

        {/* Bottom half (previous value during flip) */}
        {isFlipping && (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-md flex items-center justify-center text-2xl font-mono font-bold shadow-lg shadow-slate-900/20 overflow-hidden border border-slate-600/30 transform rotate-x-180 backface-hidden">
            <span className="drop-shadow-lg">{previousValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}
