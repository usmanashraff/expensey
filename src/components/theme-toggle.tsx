"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

interface ThemeToggleProps {
  isCollapsed?: boolean
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  if (isCollapsed) {
    return (
      <motion.button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-xs hover:shadow-md transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <Sun className="h-4.5 w-4.5 text-amber-400" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-purple-600" />
        )}
        <span className="sr-only">Toggle theme</span>
      </motion.button>
    )
  }

  return (
    <motion.button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative flex items-center justify-between w-16 h-8 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full p-1 transition-colors duration-300 hover:shadow-lg"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background track */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200/50 to-purple-200/50 dark:from-gray-600 dark:to-gray-500" />
      
      {/* Icons */}
      <div className="relative z-10 flex items-center justify-between w-full px-1">
        <Sun className={`h-4 w-4 transition-colors duration-300 ${!isDark ? 'text-orange-500' : 'text-gray-400'}`} />
        <Moon className={`h-4 w-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
      </div>
      
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-600"
        animate={{
          x: isDark ? 32 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
      
      <span className="sr-only">Toggle theme</span>
    </motion.button>
  )
}