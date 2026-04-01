'use client'

import React, { useEffect, useState } from 'react'

export function ProgressBar({ isVisible }: { isVisible: boolean }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      return
    }

    // Start progress immediately
    setProgress(10)

    // Increment progress gradually
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        return prev + Math.random() * 30
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isVisible])

  useEffect(() => {
    if (isVisible === false && progress > 0) {
      // Complete the progress bar
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 300)
      return () => clearTimeout(timeout)
    }
  }, [isVisible, progress])

  if (!isVisible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-300 z-[9999] transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 0 ? 0 : 1,
      }}
      aria-hidden="true"
    />
  )
}
