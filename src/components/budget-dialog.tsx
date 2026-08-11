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
  trigger?: React.ReactNode
}

interface Budget {
  NEED: number
  WANT: number
  SELF_DEVELOPMENT: number
  SAVINGS: number
}

export function BudgetDialog({ selectedMonth, selectedYear, onBudgetUpdated, trigger }: BudgetDialogProps) {
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
      icon: 'account_balance_wallet',
      description: 'Essential expenses like rent, utilities, groceries'
    },
    WANT: {
      label: 'Wants',
      icon: 'trending_up',
      description: 'Non-essential purchases and entertainment'
    },
    SELF_DEVELOPMENT: {
      label: 'Self Development',
      icon: 'auto_awesome',
      description: 'Investments in personal growth and learning'
    },
    SAVINGS: {
      label: 'Minimum Savings',
      icon: 'savings',
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
        {trigger ? (
          trigger
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 bg-[#f0f4f8] hover:bg-[#eaeef2] text-[#171c1f] dark:bg-[#1c2024] dark:hover:bg-[#24282c] dark:text-[#f6fafe] border border-outline-variant transition-colors rounded-lg font-sans font-semibold shadow-sm h-9 px-3"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>Set Budget</span>
            </Button>
          </motion.div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-xl shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-on-surface text-xl font-serif-heading font-bold">Set Monthly Budget</DialogTitle>
          <DialogDescription className="text-on-surface-variant font-sans font-medium mt-1">
            Configure your budget for {monthName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {Object.entries(categoryConfig).map(([key, config], index) => {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/50"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="flex items-center gap-3 text-on-surface">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant/50 text-tertiary shadow-sm`}>
                      <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-sm">{config.label}</span>
                      {key === 'SAVINGS' && (
                        <span className="text-xs text-on-surface-variant ml-1 font-sans font-medium">(Min)</span>
                      )}
                      <p className="text-xs text-on-surface-variant leading-tight font-sans mt-0.5">{config.description}</p>
                    </div>
                  </Label>
                </div>
                <div className="relative">
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
                    className={`h-10 pl-10 text-sm font-sans font-medium bg-[#ffffff] dark:bg-[#14171a] border-outline-variant text-on-surface placeholder:text-[#8b9196] focus:ring-1 focus:ring-[#496177] transition-all duration-200 rounded-lg ${
                      errors[key as keyof Budget] ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : ''
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
                className="flex items-center gap-2 p-3 rounded-lg bg-[#ffdad6] dark:bg-[#93000a]/20 border border-[#ba1a1a]/30"
              >
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a] flex-shrink-0">error</span>
                <p className="text-sm font-sans font-medium text-[#ba1a1a]">
                  Set at least one budget amount
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-outline-variant">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="font-sans font-semibold rounded-lg bg-[#f0f4f8] hover:bg-[#eaeef2] text-[#171c1f] dark:bg-[#1c2024] dark:hover:bg-[#24282c] dark:text-[#f6fafe] border-outline-variant"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#171c1f] text-[#ffffff] hover:bg-[#2c3134] dark:bg-[#f6fafe] dark:text-[#14171a] dark:hover:bg-[#d6dade] font-sans font-semibold rounded-lg shadow-sm"
          >
            {loading ? 'Saving...' : 'Save Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}