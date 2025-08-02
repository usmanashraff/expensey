'use client'

import { useState, useEffect } from 'react'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { UtilityTypeManager } from '@/components/utility-type-manager'
import { UserDropdown } from '@/components/user-dropdown'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface DashboardClientProps {
  user: {
    id: string
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [utilityRefreshTrigger, setUtilityRefreshTrigger] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUtilityTypesChanged = () => {
    setUtilityRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[oklch(0.13_0.02_250)] dark:via-[oklch(0.14_0.02_260)] dark:to-[oklch(0.15_0.02_270)] overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full filter blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x * 0.05}px`,
            top: `${mousePosition.y * 0.05}px`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-4 max-w-7xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <Image 
                  src="/logo.png" 
                  alt="Expensey Logo" 
                  width={100} 
                  height={25}
                  className="object-contain"
                  priority
                />
              </Link>
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Sparkles className="w-6 h-6 text-yellow-500/40" />
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserDropdown user={user} />
            </div>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-muted-foreground mt-4"
          >
            Track your expenses wisely, achieve your financial goals
          </motion.p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl blur-xl" />
              <ExpenseForm onExpenseAdded={handleExpenseAdded} utilityRefreshTrigger={utilityRefreshTrigger} />
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-3xl blur-xl" />
              <UtilityTypeManager onUtilityTypesChanged={handleUtilityTypesChanged} />
            </div>
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