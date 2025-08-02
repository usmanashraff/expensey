'use client'

import { useState } from 'react'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion } from 'framer-motion'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[oklch(0.13_0.02_250)] dark:via-[oklch(0.14_0.02_260)] dark:to-[oklch(0.15_0.02_270)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 relative"
        >
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Expensey
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your expenses wisely, achieve your financial goals
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <ExpenseForm onExpenseAdded={handleExpenseAdded} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <ExpenseList refreshTrigger={refreshTrigger} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}