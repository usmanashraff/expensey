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
import { Sparkles, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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
  const [isMobile, setIsMobile] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showUtilityDialog, setShowUtilityDialog] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
    if (isMobile) {
      setShowExpenseDialog(false)
    }
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

      <div className="container mx-auto pl-4 pr-2 sm:px-4 pt-4 sm:pt-0 pb-4 max-w-7xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="hidden sm:block hover:opacity-80 transition-opacity">
                <Image 
                  src="/logo.png" 
                  alt="Expensey Logo" 
                  width={80} 
                  height={20}
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
          {/* <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-muted-foreground mt-4"
          >
            Track your expenses wisely, achieve your financial goals
          </motion.p> */}
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 -mt-8 gap-8">
          {isMobile ? (
            <>
              {/* Mobile: Show Add Expense button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="fixed bottom-6 right-4 z-50"
              >
                <Button
                  onClick={() => setShowExpenseDialog(true)}
                  size="lg"
                  className="rounded-full h-14 w-14 md:h-auto md:w-auto md:px-6 shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-0 md:p-2"
                >
                  <Plus className="h-6 w-6 md:mr-2" />
                  <span className="hidden md:inline">Add Expense</span>
                </Button>
              </motion.div>
              <ExpenseList refreshTrigger={refreshTrigger} onOpenUtilities={() => setShowUtilityDialog(true)} />
            </>
          ) : (
            <>
              {/* Desktop: Show form sidebar */}
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
            </>
          )}
        </div>

        {/* Mobile Expense Dialog */}
        <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-transparent border-0 shadow-none p-0 [&>button]:hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              onExpenseAdded={handleExpenseAdded} 
              utilityRefreshTrigger={utilityRefreshTrigger}
              isInDialog={true}
              onClose={() => setShowExpenseDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Mobile Utility Dialog */}
        <Dialog open={showUtilityDialog} onOpenChange={setShowUtilityDialog}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-transparent border-0 shadow-none p-0 [&>button]:hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Manage Utility Types</DialogTitle>
            </DialogHeader>
            <UtilityTypeManager 
              onUtilityTypesChanged={() => {
                handleUtilityTypesChanged()
                setShowUtilityDialog(false)
              }}
              isInDialog={true}
              onClose={() => setShowUtilityDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}