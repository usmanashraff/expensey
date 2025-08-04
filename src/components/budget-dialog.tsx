'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, TrendingUp, Sparkles, PiggyBank, Info, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserSettings } from '@/hooks/use-user-settings'

interface BudgetDialogProps {
  selectedMonth: number
  selectedYear: number
  onBudgetUpdated?: () => void
}

interface Budget {
  NEED: number
  WANT: number
  SELF_DEVELOPMENT: number
  SAVINGS: number
}

export function BudgetDialog({ selectedMonth, selectedYear, onBudgetUpdated }: BudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [budget, setBudget] = useState<Budget>({
    NEED: 0,
    WANT: 0,
    SELF_DEVELOPMENT: 0,
    SAVINGS: 0
  })
  const [errors, setErrors] = useState<Partial<Budget>>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const { settings } = useUserSettings()

  const categoryConfig = {
    NEED: {
      label: 'Needs',
      icon: Wallet,
      color: 'from-yellow-500 to-orange-500',
      description: 'Essential expenses like rent, utilities, groceries'
    },
    WANT: {
      label: 'Wants',
      icon: TrendingUp,
      color: 'from-red-500 to-pink-500',
      description: 'Non-essential purchases and entertainment'
    },
    SELF_DEVELOPMENT: {
      label: 'Self Development',
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500',
      description: 'Investments in personal growth and learning'
    },
    SAVINGS: {
      label: 'Minimum Savings',
      icon: PiggyBank,
      color: 'from-blue-500 to-cyan-500',
      description: 'Minimum amount to save each month'
    }
  }

  useEffect(() => {
    if (open) {
      fetchBudget()
      setHasSubmitted(false)
      setErrors({})
    }
  }, [open, selectedMonth, selectedYear])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setBudget({
            NEED: data.needBudget || 0,
            WANT: data.wantBudget || 0,
            SELF_DEVELOPMENT: data.selfDevelopmentBudget || 0,
            SAVINGS: data.savingsBudget || 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch budget:', error)
    }
  }

  const validateBudget = () => {
    const newErrors: Partial<Budget> = {}
    let isValid = true

    // Check if at least one budget is set
    const totalBudget = budget.NEED + budget.WANT + budget.SELF_DEVELOPMENT + budget.SAVINGS
    if (totalBudget === 0) {
      toast.error('Please set at least one budget amount')
      isValid = false
    }

    // Validate individual fields
    Object.entries(budget).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[key as keyof Budget] = -1
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    setHasSubmitted(true)
    
    if (!validateBudget()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          needBudget: budget.NEED,
          wantBudget: budget.WANT,
          selfDevelopmentBudget: budget.SELF_DEVELOPMENT,
          savingsBudget: budget.SAVINGS,
          currency: settings.defaultCurrency || 'PKR'
        })
      })

      if (response.ok) {
        toast.success('Budget updated successfully!')
        setOpen(false)
        setHasSubmitted(false)
        setErrors({})
        onBudgetUpdated?.()
      } else {
        throw new Error('Failed to update budget')
      }
    } catch (error) {
      toast.error('Failed to update budget')
    } finally {
      setLoading(false)
    }
  }

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Button 
            variant="outline" 
            size="sm"
            className="relative flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-indigo-300/50 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-indigo-400/20 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            >
              <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors relative z-10" />
            </motion.div>
            <span className="font-medium text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-800 dark:group-hover:text-indigo-200 transition-colors relative z-10">
              Set Budget
            </span>
            <motion.div
              className="absolute -right-1 -top-1"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
            </motion.div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/80 dark:bg-[oklch(0.2_0.02_250)]/80 border-white/20 dark:border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl font-semibold">Set Monthly Budget</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure your budget for {monthName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 relative z-10 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {Object.entries(categoryConfig).map(([key, config], index) => {
            const Icon = config.icon
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-1 p-3 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r ${config.color} shadow-sm`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{config.label}</span>
                      {key === 'SAVINGS' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Min)</span>
                      )}
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">{config.description}</p>
                    </div>
                  </Label>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 z-10">
                    {settings.defaultCurrency || 'PKR'}
                  </span>
                  <Input
                    id={key}
                    type="number"
                    value={budget[key as keyof Budget] || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setBudget(prev => ({
                        ...prev,
                        [key]: value
                      }))
                      // Clear error for this field when user types
                      if (hasSubmitted && errors[key as keyof Budget]) {
                        setErrors(prev => ({
                          ...prev,
                          [key]: undefined
                        }))
                      }
                    }}
                    className={`h-9 pl-10 text-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-200 ${
                      errors[key as keyof Budget] ? 'border-red-500/50 dark:border-red-400/50' : ''
                    }`}
                    placeholder="0"
                    min="0"
                  />
                  {errors[key as keyof Budget] && (
                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1 absolute">
                      <AlertCircle className="h-2.5 w-2.5" />
                      Cannot be negative
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {/* <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-sm border border-blue-200/50 dark:border-blue-400/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              The savings budget represents the minimum amount you aim to save each month. 
              You can save more, but this helps ensure you meet your savings goals.
            </p>
          </div> */}
          
          {hasSubmitted && budget.NEED === 0 && budget.WANT === 0 && budget.SELF_DEVELOPMENT === 0 && budget.SAVINGS === 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 dark:bg-red-400/10 backdrop-blur-sm border border-red-200/50 dark:border-red-400/30"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  Set at least one budget amount
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <DialogFooter className="relative z-10">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-300/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg"
          >
            {loading ? 'Saving...' : 'Save Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}