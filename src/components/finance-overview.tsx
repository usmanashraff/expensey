'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Wallet, 
  AlertCircle, CheckCircle, Eye, EyeOff, Plus, Edit,
  ArrowUpRight, ArrowDownRight, Sparkles, PiggyBank,
  Trash2, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { IncomeForm } from '@/components/income-form'
import { BudgetDialog } from '@/components/budget-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrencyWithMask } from '@/lib/currency'
import { toast } from 'sonner'

interface FinanceOverviewProps {
  selectedMonth: number
  selectedYear: number
  showAmounts: boolean
  onToggleAmounts: () => void
  monthlyExpenses?: any[]
}

interface Income {
  id: string
  amount: number
  source: string
  date: Date
  currency: string
}

interface Budget {
  needBudget: number
  wantBudget: number
  selfDevelopmentBudget: number
  savingsBudget: number
}

// Module-level in-memory cache for instant tab switching
const financeDataCache = new Map<string, { income: Income[]; budget: Budget | null }>()

export function FinanceOverview({ 
  selectedMonth, 
  selectedYear, 
  showAmounts,
  onToggleAmounts,
  monthlyExpenses
}: FinanceOverviewProps) {
  const cacheKey = `${selectedYear}-${selectedMonth}`
  const cached = financeDataCache.get(cacheKey)

  const [income, setIncome] = useState<Income[]>(cached?.income || [])
  const [budget, setBudget] = useState<Budget | null>(cached?.budget || null)
  const [expenses, setExpenses] = useState<any[]>(monthlyExpenses || [])
  const [loading, setLoading] = useState(!cached)
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })
  
  // Sync expenses whenever monthlyExpenses prop updates
  useEffect(() => {
    if (monthlyExpenses) {
      setExpenses(monthlyExpenses)
    }
  }, [monthlyExpenses])

  // Fetch all financial data concurrently
  useEffect(() => {
    fetchFinancialData()
  }, [selectedMonth, selectedYear])

  const fetchFinancialData = async () => {
    const key = `${selectedYear}-${selectedMonth}`
    const existingData = financeDataCache.get(key)

    // Only trigger full loading spinner if we don't have cached data yet
    if (!existingData) {
      setLoading(true)
    }

    try {
      // Execute income & budget fetches in parallel
      const [incomeRes, budgetRes] = await Promise.all([
        fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`)
      ])

      const [incomeData, budgetData] = await Promise.all([
        incomeRes.ok ? incomeRes.json() : [],
        budgetRes.ok ? budgetRes.json() : null
      ])

      const validIncome = Array.isArray(incomeData) ? incomeData : []
      const validBudget = budgetData && !budgetData.error ? budgetData : null

      setIncome(validIncome)
      setBudget(validBudget)

      // Save to cache for instant rendering
      financeDataCache.set(key, { income: validIncome, budget: validBudget })

      // Fallback: If parent didn't supply monthlyExpenses, fetch expenses
      if (!monthlyExpenses) {
        const expensesRes = await fetch('/api/expenses')
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json()
          const filteredExpenses = expensesData.filter((exp: any) => {
            const expDate = new Date(exp.date)
            return expDate.getMonth() + 1 === selectedMonth && 
                   expDate.getFullYear() === selectedYear
          })
          setExpenses(filteredExpenses)
        }
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const netBalance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  // Calculate budget usage
  const totalBudget = budget ? 
    budget.needBudget + budget.wantBudget + budget.selfDevelopmentBudget : 0
  const budgetUsage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  const formatAmount = (amount: number, currency = 'PKR') => {
    return formatCurrencyWithMask(showAmounts, amount, currency)
  }

  const handleDeleteIncome = async (incomeId: string) => {
    // Find the income to delete for rollback if needed
    const incomeToDelete = income.find(inc => inc.id === incomeId)
    if (!incomeToDelete) return
    
    // Optimistically remove from state immediately
    setIncome(prev => prev.filter(inc => inc.id !== incomeId))
    setDeleteConfirmId(null)
    
    // Show feedback immediately
    toast.success('Income source deleted')
    
    try {
      const response = await fetch(`/api/income/${incomeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete income')
      }
      
      // Success - no need to refresh, already updated optimistically
      
    } catch (error) {
      console.error('Error deleting income:', error)
      
      // Rollback on error - add the income back
      setIncome(prev => {
        const newIncome = [...prev, incomeToDelete]
        // Sort by date to maintain order
        return newIncome.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      })
      
      toast.error('Failed to delete income source')
    } finally {
      setDeletingIncomeId(null)
    }
  }

  const categoryConfig = {
    NEED: { 
      label: 'Needs', 
      color: 'from-red-500 to-orange-500',
      budget: budget?.needBudget || 0,
      spent: expensesByCategory.NEED || 0
    },
    WANT: { 
      label: 'Wants', 
      color: 'from-yellow-500 to-amber-500',
      budget: budget?.wantBudget || 0,
      spent: expensesByCategory.WANT || 0
    },
    SELF_DEVELOPMENT: { 
      label: 'Growth', 
      color: 'from-green-500 to-emerald-500',
      budget: budget?.selfDevelopmentBudget || 0,
      spent: expensesByCategory.SELF_DEVELOPMENT || 0
    },
    SAVINGS: { 
      label: 'Savings', 
      color: 'from-blue-500 to-indigo-500',
      budget: budget?.savingsBudget || 0,
      spent: expensesByCategory.SAVINGS || 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Financial Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <section className="bg-white dark:bg-[#1c2024] border border-outline-variant rounded-xl p-8 relative overflow-hidden">
          {/* Subtle background decorative element */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#f6f9ff]/30 dark:from-[#f6f9ff]/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-end items-center mb-6">
              <button 
                onClick={onToggleAmounts}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">{showAmounts ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#f0f4f8] dark:bg-[#14171a] border border-outline-variant/50 rounded-xl p-5 hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-2 text-on-surface-variant font-sans text-sm font-semibold mb-2">
                  <span className="material-symbols-outlined text-[16px] text-[#212529] dark:text-[#f6fafe]">south_east</span> Income
                </div>
                <div className="font-serif-heading text-2xl font-medium text-[#212529] dark:text-[#f6fafe]">{formatAmount(totalIncome)}</div>
              </div>

              <div className="bg-[#f0f4f8] dark:bg-[#14171a] border border-outline-variant/50 rounded-xl p-5 hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-2 text-on-surface-variant font-sans text-sm font-semibold mb-2">
                  <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">north_east</span> Expenses
                </div>
                <div className="font-serif-heading text-2xl font-medium text-[#ba1a1a]">{formatAmount(totalExpenses)}</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1">{budgetUsage.toFixed(0)}% of budget</div>
              </div>

              <div className="bg-[#f0f4f8] dark:bg-[#14171a] border border-outline-variant/50 rounded-xl p-5 hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-2 text-on-surface-variant font-sans text-sm font-semibold mb-2">
                  <span className="material-symbols-outlined text-[16px] text-tertiary dark:text-on-surface">{netBalance >= 0 ? 'trending_up' : 'trending_down'}</span> Balance
                </div>
                <div className={`font-serif-heading text-2xl font-medium ${netBalance >= 0 ? 'text-tertiary dark:text-on-surface' : 'text-[#ba1a1a]'}`}>{formatAmount(Math.abs(netBalance))}</div>
                {netBalance < 0 && <div className="font-sans text-xs text-[#ba1a1a] mt-1">Deficit</div>}
              </div>

              <div className="bg-[#f0f4f8] dark:bg-[#14171a] border border-outline-variant/50 rounded-xl p-5 hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-2 text-on-surface-variant font-sans text-sm font-semibold mb-2">
                  <span className="material-symbols-outlined text-[16px] text-tertiary dark:text-on-surface">savings</span> Saved
                </div>
                <div className="font-serif-heading text-2xl font-medium text-tertiary dark:text-on-surface">{savingsRate.toFixed(0)}%</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1">{formatAmount(netBalance > 0 ? netBalance : 0)}</div>
              </div>
            </div>

            {/* Budget Allocation */}
            <div className="space-y-6">
              <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface border-b border-outline-variant/50 pb-2">Budget Allocation</h4>
              
              {Object.entries(categoryConfig).map(([key, config]) => {
                const percentage = config.budget > 0 ? (config.spent / config.budget) * 100 : 0
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between font-sans text-xs font-medium">
                      <span className="text-on-surface">{config.label}</span>
                      <span className="text-on-surface-variant">
                        {formatAmount(config.spent)} / {formatAmount(config.budget)} 
                        <span className="font-semibold text-on-surface ml-2">{percentage.toFixed(0)}%</span>
                      </span>
                    </div>
                    {/* Native progress element customized in globals.css */}
                    <progress className="w-full h-2 rounded-full overflow-hidden appearance-none" max="100" value={percentage}></progress>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowIncomeDialog(true)}
                className="flex-1 bg-[#f0f4f8] dark:bg-[#14171a] border border-outline-variant hover:border-[#496177] dark:hover:border-[#f6fafe] hover:bg-surface-container text-on-surface font-sans text-sm font-semibold tracking-wide py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Add Income
              </button>
              
              {budget ? (
                <BudgetDialog 
                  selectedMonth={selectedMonth} 
                  selectedYear={selectedYear}
                  onBudgetUpdated={fetchFinancialData}
                  trigger={
                    <button className="bg-[#212529] dark:bg-[#f6fafe] hover:bg-black dark:hover:bg-white text-white dark:text-[#14171a] font-sans text-sm font-semibold tracking-wide py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span> Edit Budget
                    </button>
                  }
                />
              ) : (
                <BudgetDialog 
                  selectedMonth={selectedMonth} 
                  selectedYear={selectedYear}
                  onBudgetUpdated={fetchFinancialData}
                  trigger={
                    <button className="bg-[#212529] dark:bg-[#f6fafe] hover:bg-black dark:hover:bg-white text-white dark:text-[#14171a] font-sans text-sm font-semibold tracking-wide py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span> Set Budget
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </section>
      </motion.div>

      {/* Recent Income List (Compact) */}
      {income.length > 0 ? (
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Income Sources</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{income.length} source{income.length !== 1 ? 's' : ''}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowIncomeDialog(true)}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence mode="popLayout">
              {income.slice(0, 5).map((inc) => (
                <motion.div
                  key={inc.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                >
                <div className="flex-1">
                  <p className="text-sm font-medium">{inc.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inc.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: selectedYear !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{formatAmount(inc.amount, inc.currency || 'PKR')}
                  </p>
                  {deleteConfirmId === inc.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteIncome(inc.id)}
                        disabled={deletingIncomeId === inc.id}
                        className="h-6 px-2 text-xs"
                      >
                        {deletingIncomeId === inc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(null)}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(inc.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete income"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {income.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                And {income.length - 5} more...
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl">
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No income recorded for {monthName}</p>
            <Button
              onClick={() => setShowIncomeDialog(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Income
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Income Dialog */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <IncomeForm 
            onIncomeAdded={(newIncome: any, optimisticId?: string) => {
              if (newIncome && !optimisticId) {
                // This is the initial optimistic add
                setIncome(prev => {
                  const updated = [newIncome, ...prev]
                  return updated.sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                })
                setShowIncomeDialog(false)
              } else if (newIncome && optimisticId) {
                // Replace optimistic with real income
                setIncome(prev => prev.map(inc => 
                  inc.id === optimisticId ? newIncome : inc
                ))
              } else if (!newIncome && optimisticId) {
                // Remove optimistic income on error
                setIncome(prev => prev.filter(inc => inc.id !== optimisticId))
              }
            }}
            isInDialog={true}
            onClose={() => setShowIncomeDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}