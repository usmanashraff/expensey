"use client"

import * as React from "react"
import { useTheme } from "next-themes"

interface ThemeToggleProps {
  isCollapsed?: boolean
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  if (isCollapsed) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex items-center justify-center p-2 rounded-full bg-surface-container text-on-surface transition-colors"
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="material-symbols-outlined text-sm">{isDark ? 'dark_mode' : 'light_mode'}</span>
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  return (
    <div className="flex gap-1 bg-surface-container rounded-full p-1 border border-outline-variant/30">
      <button 
        onClick={() => setTheme("light")}
        className={`p-1 rounded-full flex items-center justify-center transition-all ${
          !isDark 
            ? 'bg-[#ffffff] shadow-sm text-[#171c1f]' 
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
        title="Light Mode"
      >
        <span className="material-symbols-outlined text-sm">light_mode</span>
      </button>
      <button 
        onClick={() => setTheme("dark")}
        className={`p-1 rounded-full flex items-center justify-center transition-all ${
          isDark 
            ? 'bg-[#1c2024] shadow-sm text-[#f6fafe]' 
            : 'text-[#5b5f63] hover:text-[#171c1f]'
        }`}
        title="Dark Mode"
      >
        <span className="material-symbols-outlined text-sm">dark_mode</span>
      </button>
    </div>
  )
}