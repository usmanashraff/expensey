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

export function FinanceOverview({ 
  selectedMonth, 
  selectedYear, 
  showAmounts,
  onToggleAmounts 
}: FinanceOverviewProps) {
  const [income, setIncome] = useState<Income[]>([])
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })
  
  // Fetch all financial data
  useEffect(() => {
    fetchFinancialData()
  }, [selectedMonth, selectedYear])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      // Fetch income
      const incomeRes = await fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`)
      const incomeData = await incomeRes.json()
      setIncome(Array.isArray(incomeData) ? incomeData : [])

      // Fetch budget
      const budgetRes = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`)
      const budgetData = await budgetRes.json()
      setBudget(budgetData)

      // Fetch expenses for calculations
      const expensesRes = await fetch('/api/expenses')
      const expensesData = await expensesRes.json()
      
      // Filter expenses for selected month
      const filteredExpenses = expensesData.filter((exp: any) => {
        const expDate = new Date(exp.date)
        return expDate.getMonth() + 1 === selectedMonth && 
               expDate.getFullYear() === selectedYear
      })
      setExpenses(filteredExpenses)
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
        <Card className="relative backdrop-blur-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
          
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                {monthName} Financial Health
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAmounts}
                className="hover:bg-white/20"
              >
                {showAmounts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Income */}
              <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Income</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(totalIncome)}
                </p>
                {income.length === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs mt-1 p-0"
                    onClick={() => setShowIncomeDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {/* Expenses */}
              <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">Expenses</span>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {budgetUsage.toFixed(0)}% of budget
                </p>
              </div>

              {/* Net Balance */}
              <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  {netBalance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="text-xs text-muted-foreground">Balance</span>
                </div>
                <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatAmount(Math.abs(netBalance))}
                </p>
                {netBalance < 0 && (
                  <p className="text-xs text-orange-600">Deficit</p>
                )}
              </div>

              {/* Savings Rate */}
              <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PiggyBank className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">Saved</span>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {savingsRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(netBalance > 0 ? netBalance : 0)}
                </p>
              </div>
            </div>

            {/* Budget Progress Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Budget Allocation</h4>
                {!budget && (
                  <BudgetDialog 
                    selectedMonth={selectedMonth} 
                    selectedYear={selectedYear}
                    onBudgetUpdated={fetchFinancialData}
                  />
                )}
              </div>

              {Object.entries(categoryConfig).map(([key, config]) => {
                const percentage = config.budget > 0 ? 
                  (config.spent / config.budget) * 100 : 0
                const isOverBudget = percentage > 100
                const isSavings = key === 'SAVINGS'
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{config.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`${isOverBudget && !isSavings ? 'text-red-600' : ''}`}>
                          {formatAmount(config.spent)} / {formatAmount(config.budget)}
                        </span>
                        <Badge 
                          variant={isOverBudget && !isSavings ? "destructive" : "secondary"}
                          className="text-xs px-1.5 py-0"
                        >
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                      />
                      {isOverBudget && !isSavings && (
                        <div className="absolute inset-y-0 right-0 w-1 bg-red-500 animate-pulse rounded-r" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              {income.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowIncomeDialog(true)}
                  className="flex-1"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Income
                </Button>
              )}
              {budget && (
                <BudgetDialog 
                  selectedMonth={selectedMonth} 
                  selectedYear={selectedYear}
                  onBudgetUpdated={fetchFinancialData}
                />
              )}
            </div>
          </CardContent>
        </Card>
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