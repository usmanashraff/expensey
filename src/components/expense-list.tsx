'use client'

import { useState, useEffect } from 'react'
// PDF generation types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Expense } from '@/generated/prisma'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ExpenseCharts } from './expense-charts'
import { SavingsChart } from './savings-chart'
import { UtilityCharts } from './utility-charts'
import { FinanceOverview } from './finance-overview'
import AIInsights from './ai-insights'
import { ChevronDown, ChevronUp, BarChart3, ChevronLeft, ChevronRight, Calendar, Receipt, Zap, Eye, EyeOff, TrendingUp, PiggyBank, Wallet, Trash2, X, Target, Download, Loader2, Menu, Settings, FileDown, DollarSign, Brain, Pencil } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetDialog } from './budget-dialog'
import { Progress } from '@/components/ui/progress'
import { formatCurrencyWithMask } from '@/lib/currency'
import { DeleteExpenseDialog } from './delete-expense-dialog'
import { ExpenseDetailsDialog } from './expense-details-dialog'

interface ExpenseListProps {
  refreshTrigger: number
  onOpenUtilities?: () => void
  optimisticExpense?: Expense | null
  onOptimisticExpenseConfirmed?: () => void
}

export function ExpenseList({ refreshTrigger, onOpenUtilities, optimisticExpense, onOptimisticExpenseConfirmed }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthlySavings, setMonthlySavings] = useState<number>(0)
  const [totalSavings, setTotalSavings] = useState<number>(0)
  const [optimisticUpdateActive, setOptimisticUpdateActive] = useState(false)
  const [previousOptimisticExpense, setPreviousOptimisticExpense] = useState<Expense | null>(null)
  const [showCharts, setShowCharts] = useState(false)
  const [showUtilityCharts, setShowUtilityCharts] = useState(false)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showAmounts, setShowAmounts] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<{year: number, month: number}[]>([])
  const [budget, setBudget] = useState<{
    needBudget: number
    wantBudget: number
    selfDevelopmentBudget: number
    savingsBudget: number
  } | null>(null)
  
  // Savings editing state
  const [isEditingMonthlySavings, setIsEditingMonthlySavings] = useState(false)
  const [isEditingLifetimeSavings, setIsEditingLifetimeSavings] = useState(false)
  const [monthlySavingsInput, setMonthlySavingsInput] = useState('')
  const [lifetimeSavingsInput, setLifetimeSavingsInput] = useState('')
  const [savingSavingsLoading, setSavingSavingsLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Date filtering state - must be after selectedMonth and selectedYear
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Initialize with the first day of the selected month
    return new Date(selectedYear, selectedMonth - 1, 1)
  })
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeView, setActiveView] = useState<'expenses' | 'finance' | 'visualization' | 'ai'>('expenses')
  
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // Generate years array (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
  
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  // Helper function to get week boundaries for a month
  const getWeekBoundaries = (weekNumber: number, month: number, year: number) => {
    const firstDay = new Date(year, month - 1, 1)
    const startOfWeek = new Date(firstDay)
    startOfWeek.setDate(1 + (weekNumber - 1) * 7)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    // Ensure end of week doesn't go into next month
    const lastDayOfMonth = new Date(year, month, 0)
    if (endOfWeek > lastDayOfMonth) {
      endOfWeek.setTime(lastDayOfMonth.getTime())
    }
    
    return { start: startOfWeek, end: endOfWeek }
  }
  
  // Get the current week number for a given date within a month
  const getWeekOfMonth = (date: Date) => {
    const dayOfMonth = date.getDate()
    return Math.ceil(dayOfMonth / 7)
  }
  
  // Check if a week is in the future
  const isWeekInFuture = (weekNumber: number, month: number, year: number) => {
    const now = new Date()
    const { start } = getWeekBoundaries(weekNumber, month, year)
    return start > now
  }

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      
      // Filter expenses for selected month
      const filteredExpenses = data.filter((expense: Expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() + 1 === selectedMonth && 
               expenseDate.getFullYear() === selectedYear
      })
      
      setExpenses(filteredExpenses)
      
      // If we have an optimistic expense and it's now in the real data, 
      // we can safely clear the optimistic state
      if (optimisticExpense && onOptimisticExpenseConfirmed) {
        const expenseInData = filteredExpenses.some((exp: Expense) => 
          exp.amount === optimisticExpense.amount && 
          exp.description === optimisticExpense.description &&
          exp.category === optimisticExpense.category
        )
        
        if (expenseInData) {
          // Notify parent to clear optimistic expense
          setTimeout(() => {
            onOptimisticExpenseConfirmed()
          }, 100) // Small delay to ensure smooth transition
        }
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      if (!optimisticUpdateActive) {
        setLoading(false)
      }
    }
  }
  
  // Filter expenses based on date filter selection
  const getFilteredExpenses = () => {
    const baseExpenses = displayExpenses
    
    if (dateFilter === 'month') {
      return baseExpenses
    }
    
    return baseExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      
      if (dateFilter === 'day') {
        return expenseDate.toDateString() === selectedDate.toDateString()
      } else if (dateFilter === 'week') {
        // Use the selected week boundaries
        const { start, end } = getWeekBoundaries(selectedWeek, selectedMonth, selectedYear)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        
        return expenseDate >= start && expenseDate <= end
      }
      
      return true
    })
  }
  
  const fetchSavings = async () => {
    try {
      // Fetch monthly savings
      const monthlyResponse = await fetch(`/api/savings?month=${selectedMonth}&year=${selectedYear}`)
      if (monthlyResponse.ok) {
        const monthlyData = await monthlyResponse.json()
        
        setMonthlySavings(monthlyData.savings)
      }
      
      // Fetch total lifetime savings (calculated from all months)
      const totalResponse = await fetch('/api/total-savings')
      if (totalResponse.ok) {
        const totalData = await totalResponse.json()
        setTotalSavings(totalData.totalSavings)
      }
    } catch (error) {
      console.error('Failed to fetch savings:', error)
    }
  }

  const fetchAvailableMonths = async () => {
    try {
      const response = await fetch('/api/available-months')
      if (response.ok) {
        const data = await response.json()
        setAvailableMonths(data)
      }
    } catch (error) {
      console.error('Failed to fetch available months:', error)
    }
  }

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setBudget(data)
      }
    } catch (error) {
      console.error('Failed to fetch budget:', error)
    }
  }

  const handleOpenEditMonthlySavings = () => {
    setMonthlySavingsInput(optimisticMonthlySavings.toString())
    setIsEditingMonthlySavings(true)
  }

  const handleOpenEditLifetimeSavings = () => {
    setLifetimeSavingsInput(totalSavings.toString())
    setIsEditingLifetimeSavings(true)
  }

  const handleSaveMonthlySavings = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(monthlySavingsInput)
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid non-negative savings amount')
      return
    }

    setSavingSavingsLoading(true)
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          month: selectedMonth,
          year: selectedYear,
        }),
      })

      if (res.ok) {
        setMonthlySavings(amount)
        await fetchSavings()
        toast.success(`${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' })} savings updated successfully!`)
        setIsEditingMonthlySavings(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update monthly savings')
      }
    } catch (error) {
      console.error('Error saving monthly savings:', error)
      toast.error('An error occurred while updating monthly savings')
    } finally {
      setSavingSavingsLoading(false)
    }
  }

  const handleSaveLifetimeSavings = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(lifetimeSavingsInput)
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid non-negative savings amount')
      return
    }

    setSavingSavingsLoading(true)
    try {
      const res = await fetch('/api/total-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalSavings: amount }),
      })

      if (res.ok) {
        setTotalSavings(amount)
        await fetchSavings()
        toast.success('Lifetime savings updated successfully!')
        setIsEditingLifetimeSavings(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update lifetime savings')
      }
    } catch (error) {
      console.error('Error saving lifetime savings:', error)
      toast.error('An error occurred while updating lifetime savings')
    } finally {
      setSavingSavingsLoading(false)
    }
  }
  

  useEffect(() => {
    const fetchMonthData = async () => {
      // Only show month loading if it's a month/year change, not initial load or refresh
      // Don't show loading if we have an optimistic update
      if (!loading && !optimisticUpdateActive) {
        setMonthLoading(true)
      }
      
      try {
        await Promise.all([
          fetchExpenses(),
          fetchSavings(),
          fetchBudget()
        ])
      } finally {
        setMonthLoading(false)
        // Don't clear optimistic update here - let it be handled by the parent component
      }
    }
    
    fetchMonthData()
    
    // Update selectedDate to the first day of the new month
    setSelectedDate(new Date(selectedYear, selectedMonth - 1, 1))
    // Reset to week 1 when month changes
    setSelectedWeek(1)
  }, [refreshTrigger, selectedMonth, selectedYear])

  useEffect(() => {
    fetchAvailableMonths()
  }, [refreshTrigger])

  // Handle optimistic updates
  useEffect(() => {
    if (optimisticExpense) {
      setOptimisticUpdateActive(true)
      setPreviousOptimisticExpense(optimisticExpense)
    } else if (previousOptimisticExpense) {
      // Keep active for a bit to prevent flicker during transition
      setTimeout(() => {
        setOptimisticUpdateActive(false)
        setPreviousOptimisticExpense(null)
      }, 200)
    } else {
      setOptimisticUpdateActive(false)
    }
  }, [optimisticExpense, previousOptimisticExpense])
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
  }

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    setDetailsDialogOpen(true)
  }

  const handleDeleteFromDetails = async () => {
    if (!selectedExpense) return
    
    setExpenseToDelete(selectedExpense)
    setDetailsDialogOpen(false)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return

    setDeletingExpenseId(expenseToDelete.id)
    
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchExpenses()
      await fetchSavings() // Refresh savings in case a SAVINGS expense was deleted
      toast.success('Expense deleted successfully!')
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to delete expense')
    } finally {
      setDeletingExpenseId(null)
      setExpenseToDelete(null)
    }
  }

  const handleDownloadReceipt = (expense: Expense) => {
    if (!expense.receipt) return

    try {
      // Extract base64 data and file type
      const matches = expense.receipt.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        toast.error('Invalid receipt format')
        return
      }

      const mimeType = matches[1]
      const base64Data = matches[2]
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Generate filename
      const extension = mimeType.includes('pdf') ? 'pdf' : 
                       mimeType.includes('png') ? 'png' : 
                       mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 
                       'webp'
      const date = new Date(expense.date).toISOString().split('T')[0]
      a.download = `receipt_${expense.description.replace(/\s+/g, '_')}_${date}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Receipt downloaded!')
    } catch (error) {
      console.error('Failed to download receipt:', error)
      toast.error('Failed to download receipt')
    }
  }

  const categoryConfig = {
    NEED: { 
      label: 'Needs',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-300'
    },
    WANT: {
      label: 'Wants',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-300'
    },
    SELF_DEVELOPMENT: {
      label: 'Self Development',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300'
    },
    SAVINGS: {
      label: 'Savings',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300'
    },
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number, currency: string = 'PKR') => {
    return formatCurrencyWithMask(showAmounts, amount, currency)
  }

  // Combine actual expenses with optimistic expense for display
  const displayExpenses = (() => {
    const expenseToUse = optimisticExpense || previousOptimisticExpense
    
    if (!optimisticUpdateActive || !expenseToUse) {
      return expenses
    }
    
    // Check if optimistic expense belongs to current selected month/year
    const optimisticDate = new Date(expenseToUse.date)
    const belongsToSelectedPeriod = 
      optimisticDate.getMonth() + 1 === selectedMonth && 
      optimisticDate.getFullYear() === selectedYear
    
    if (belongsToSelectedPeriod) {
      // Check if expense is already in the list
      const alreadyExists = expenses.some((exp: Expense) => 
        exp.amount === expenseToUse.amount && 
        exp.description === expenseToUse.description &&
        exp.category === expenseToUse.category
      )
      
      if (!alreadyExists) {
        return [...expenses, expenseToUse]
      }
    }
    
    return expenses
  })()

  const totalExpenses = displayExpenses
    .filter(expense => expense.category !== 'SAVINGS')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByCategory = displayExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
  
  // Calculate optimistic monthly savings
  const optimisticMonthlySavings = (() => {
    const expenseToUse = optimisticExpense || previousOptimisticExpense
    
    if (!optimisticUpdateActive || !expenseToUse || expenseToUse.category !== 'SAVINGS') {
      return monthlySavings
    }
    
    // Check if optimistic expense belongs to current selected month/year
    const optimisticDate = new Date(expenseToUse.date)
    const belongsToSelectedPeriod = 
      optimisticDate.getMonth() + 1 === selectedMonth && 
      optimisticDate.getFullYear() === selectedYear
    
    if (belongsToSelectedPeriod) {
      // Check if savings is already included in monthlySavings
      const expectedNewTotal = monthlySavings
      const optimisticTotal = monthlySavings + expenseToUse.amount
      
      // If monthlySavings already includes this expense, don't add it again
      if (Math.abs(monthlySavings - optimisticTotal) < 0.01) {
        return monthlySavings
      }
      
      return optimisticTotal
    }
    
    return monthlySavings
  })()

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth
    let newYear = selectedYear
    
    // Keep trying until we find a month with data or reach limits
    const maxAttempts = 12 * 6 // 6 years of data
    let attempts = 0
    
    while (attempts < maxAttempts) {
      if (direction === 'prev') {
        if (newMonth === 1) {
          newMonth = 12
          newYear = newYear - 1
        } else {
          newMonth = newMonth - 1
        }
      } else {
        if (newMonth === 12) {
          newMonth = 1
          newYear = newYear + 1
        } else {
          newMonth = newMonth + 1
        }
      }
      
      // Check if this month has data or is the current month
      if (hasDataForMonth(newMonth, newYear)) {
        setSelectedMonth(newMonth)
        setSelectedYear(newYear)
        break
      }
      
      // Stop at current month when going next
      if (direction === 'next' && newMonth === currentMonth && newYear === currentYear) {
        break
      }
      
      attempts++
    }
  }

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear
  const canGoNext = !(selectedMonth === currentMonth && selectedYear === currentYear)
  
  const isMonthAvailable = (month: number, year: number) => {
    return availableMonths.some(am => am.month === month && am.year === year)
  }
  
  const hasDataForMonth = (month: number, year: number) => {
    // Always allow current month
    if (month === currentMonth && year === currentYear) return true
    return isMonthAvailable(month, year)
  }

  const exportToPDF = async () => {
    // Use displayExpenses which includes properly formatted data
    const monthlyExpenses = displayExpenses || []
    
    // Debug info - can be removed later
    console.log('PDF Export: Processing', monthlyExpenses.length, 'expenses for', monthName)
    
    // Validate that there's data to export
    if (monthlyExpenses.length === 0 && optimisticMonthlySavings === 0) {
      toast.error('No data available to export for this month')
      return
    }

    // Show loading toast
    toast.loading('Generating PDF with AI insights...')

    try {
      // Fetch monthly income data
      let monthlyIncome = 0
      try {
        const incomeResponse = await fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`)
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json()
          monthlyIncome = incomeData.reduce((sum: number, income: any) => sum + income.amount, 0)
          console.log('Monthly income:', monthlyIncome)
        }
      } catch (error) {
        console.error('Error fetching income:', error)
      }
      
      // Get AI-powered insights for smart recommendations
      let aiInsights: {
        healthScore?: string
        recommendations?: string[]
        concerns?: string[]
        positives?: string[]
      } = {}
      
      try {
        const aiResponse = await fetch('/api/ai/analyze-spending', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ month: selectedMonth, year: selectedYear, timeframe: 'month' })
        })
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          if (aiData.analysis) {
            // Parse health score
            const scoreMatch = aiData.analysis.match(/Score:\s*(\d+\/10)/i)
            if (scoreMatch) {
              aiInsights.healthScore = scoreMatch[1]
            }
            
            // Parse recommendations
            const recsMatch = aiData.analysis.match(/##\s*4\.\s*Smart Recommendations[\s\S]*?(?=##|$)/i)
            if (recsMatch) {
              const recsText = recsMatch[0].replace(/##\s*4\.\s*Smart Recommendations/i, '').trim()
              aiInsights.recommendations = recsText
                .split('\n')
                .filter((line: string) => line.startsWith('•') || line.startsWith('-'))
                .map((line: string) => line.replace(/^[•\-]\s*/, '').trim())
                .filter((line: string) => line.length > 0)
                .slice(0, 4) // Limit to 4 recommendations
            }
            
            // Parse concerns
            const concernsMatch = aiData.analysis.match(/##\s*3\.\s*Top Concerns[\s\S]*?(?=##|$)/i)
            if (concernsMatch) {
              const concernsText = concernsMatch[0].replace(/##\s*3\.\s*Top Concerns/i, '').trim()
              aiInsights.concerns = concernsText
                .split('\n')
                .filter((line: string) => line.startsWith('•') || line.startsWith('-'))
                .map((line: string) => line.replace(/^[•\-]\s*/, '').trim())
                .filter((line: string) => line.length > 0)
                .slice(0, 3)
            }
            
            // Parse positive points
            const positivesMatch = aiData.analysis.match(/##\s*5\.\s*Positive Points[\s\S]*?(?=##|$)/i)
            if (positivesMatch) {
              const positivesText = positivesMatch[0].replace(/##\s*5\.\s*Positive Points/i, '').trim()
              aiInsights.positives = positivesText
                .split('\n')
                .filter((line: string) => line.startsWith('•') || line.startsWith('-'))
                .map((line: string) => line.replace(/^[•\-]\s*/, '').trim())
                .filter((line: string) => line.length > 0)
                .slice(0, 2)
            }
          }
        }
      } catch (error) {
        console.error('Error getting AI insights:', error)
        // Continue without AI insights if there's an error
      }
      // Dynamic import to handle client-side loading
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      
      // Import autoTable plugin - this extends jsPDF prototype
      try {
        await import('jspdf-autotable')
        console.log('AutoTable plugin loaded successfully')
      } catch (error) {
        console.warn('AutoTable plugin failed to load:', error)
      }
      
      const pdf = new jsPDF()
      
      // Helper function to clean text and prevent special characters
      const cleanText = (text: string) => {
        return text.replace(/[^\x20-\x7E]/g, '').replace(/[^\w\s\-\(\)\/\.,]/g, '').trim()
      }
      
      // Define colors using financial best practices
      const colors = {
        primary: [59, 130, 246] as [number, number, number], // Professional blue
        need: [239, 68, 68] as [number, number, number], // Red - essential expenses
        want: [245, 158, 11] as [number, number, number], // Orange - discretionary
        selfDev: [34, 197, 94] as [number, number, number], // Green - investment
        savings: [147, 51, 234] as [number, number, number], // Purple - savings
        background: [248, 250, 252] as [number, number, number], // Light gray
        text: [15, 23, 42] as [number, number, number], // Dark slate
        accent: [59, 130, 246] as [number, number, number], // Blue
        lightGray: [230, 230, 230] as [number, number, number], // Light gray
        success: [34, 197, 94] as [number, number, number], // Green
        warning: [245, 158, 11] as [number, number, number], // Yellow
        danger: [239, 68, 68] as [number, number, number] // Red
      }
      
      const categoryLabels = {
        NEED: 'Needs',
        WANT: 'Wants', 
        SELF_DEVELOPMENT: 'Self Development',
        SAVINGS: 'Savings'
      }
      
      const categoryColors = {
        NEED: colors.need,
        WANT: colors.want,
        SELF_DEVELOPMENT: colors.selfDev,
        SAVINGS: colors.savings
      }
      
      // Budget goals mapping
      const budgetGoals = {
        NEED: budget?.needBudget || 0,
        WANT: budget?.wantBudget || 0,
        SELF_DEVELOPMENT: budget?.selfDevelopmentBudget || 0,
        SAVINGS: budget?.savingsBudget || 0
      }

      // Calculate category totals from monthly expenses
      const categoryTotals: Record<string, number> = {}
      monthlyExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
      })
      
      // Category breakdown calculated

      // Get date range for the month
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
      const lastDay = new Date(selectedYear, selectedMonth, 0)
      const dateRange = `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      
      // Header with professional design
      pdf.setFillColor(...colors.primary)
      pdf.rect(0, 0, 210, 35, 'F')
      
      // Logo/Brand
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(28)
      pdf.setFont('helvetica', 'bold')
      pdf.text('EXPENSEY', 20, 20)
      
      // Subtitle with date range
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Monthly Financial Report: ${monthName}`, 20, 28)
      pdf.text(dateRange, 150, 28)
      
      // Reset text color
      pdf.setTextColor(...colors.text)
      let yPosition = 45
      
      // Calculate totals and utilities breakdown
      const totalAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const totalBudget = Object.values(budgetGoals).reduce((sum, budget) => sum + budget, 0)
      
      const utilityBreakdown: Record<string, number> = {}
      monthlyExpenses.forEach(expense => {
        if (expense.subcategory) {
          utilityBreakdown[expense.subcategory] = (utilityBreakdown[expense.subcategory] || 0) + expense.amount
        }
      })
      
      // ==== SECTION 1: KEY METRICS ====
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Financial Overview', 15, yPosition)
      
      yPosition += 15
      
      // Better aligned layout
      pdf.setFontSize(10)
      
      // Row 1
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...colors.text)
      pdf.text('Total Transactions:', 15, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${monthlyExpenses.length}`, 80, yPosition)
      
      pdf.setFont('helvetica', 'normal')
      pdf.text('Monthly Savings:', 115, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`PKR ${optimisticMonthlySavings.toLocaleString()}`, 160, yPosition)
      
      yPosition += 12
      
      // Row 2
      pdf.setFont('helvetica', 'normal')
      pdf.text('Total Spent:', 15, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`PKR ${totalAmount.toLocaleString()}`, 80, yPosition)
      
      pdf.setFont('helvetica', 'normal')
      pdf.text('Lifetime Savings:', 115, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`PKR ${totalSavings.toLocaleString()}`, 160, yPosition)
      
      yPosition += 12
      
      // Row 3
      pdf.setFont('helvetica', 'normal')
      pdf.text('Avg per Transaction:', 15, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`PKR ${monthlyExpenses.length > 0 ? Math.round(totalAmount / monthlyExpenses.length).toLocaleString() : '0'}`, 80, yPosition)
      
      pdf.setFont('helvetica', 'normal')
      pdf.text('Savings Rate:', 115, yPosition)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${totalAmount > 0 ? ((optimisticMonthlySavings / (totalAmount + optimisticMonthlySavings)) * 100).toFixed(1) : 0}%`, 160, yPosition)
      
      yPosition += 15
      
      // Divider line
      pdf.setDrawColor(...colors.lightGray)
      pdf.setLineWidth(0.5)
      pdf.line(15, yPosition, 195, yPosition)
      yPosition += 10
      
      // ==== SECTION 2: SPENDING BY CATEGORY ====
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Spending Breakdown', 15, yPosition)
      
      yPosition += 15
      
      // Category spending with better spacing
      pdf.setFontSize(10)
      Object.entries(categoryTotals).forEach(([category, amount], index) => {
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        const label = categoryLabels[category as keyof typeof categoryLabels] || category
        const color = categoryColors[category as keyof typeof categoryColors] || colors.primary
        
        const y = yPosition + index * 12
        
        // Category label with color
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', 'bold')
        pdf.text(label, 15, y)
        
        // Amount moved further right to avoid overlap
        pdf.setTextColor(...colors.text)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`PKR ${amount.toLocaleString()}`, 90, y)
        
        // Percentage even further right
        pdf.text(`(${percentage.toFixed(1)}%)`, 145, y)
      })
      
      yPosition += Object.keys(categoryTotals).length * 12 + 15
      
      // ==== SECTION 3: BUDGET GOALS COMPARISON ====
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Budget vs Actual Spending', 15, yPosition)
      
      yPosition += 15
      
      // Budget comparison with table-like layout
      pdf.setFontSize(10)
      Object.entries(categoryTotals).forEach(([category, spent], index) => {
        const budgetAmount = budgetGoals[category as keyof typeof budgetGoals] || 0
        const remaining = budgetAmount - spent
        const label = categoryLabels[category as keyof typeof categoryLabels] || category
        const color = categoryColors[category as keyof typeof categoryColors] || colors.primary
        
        const y = yPosition + index * 18  // Adjusted spacing
        
        // Category name
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', 'bold')
        pdf.text(label, 15, y)
        
        // Budget, Spent, and Status on the second line
        pdf.setTextColor(...colors.text)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text(`Budget: PKR ${budgetAmount.toLocaleString()}`, 15, y + 7)
        pdf.text(`Spent: PKR ${spent.toLocaleString()}`, 85, y + 7)
        
        // Status aligned to the right
        if (budgetAmount > 0) {
          const statusColor = remaining >= 0 ? colors.success : colors.danger
          const statusText = remaining >= 0 ? `Under by PKR ${remaining.toLocaleString()}` : `Over by PKR ${Math.abs(remaining).toLocaleString()}`
          pdf.setTextColor(...statusColor)
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.text(statusText, 145, y + 7)
        } else {
          pdf.setTextColor(...colors.text)
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(9)
          pdf.text('No budget set', 145, y + 7)
        }
      })
      
      yPosition += Object.keys(categoryTotals).length * 18 + 10
      
      // Divider line
      pdf.setDrawColor(...colors.lightGray)
      pdf.line(15, yPosition, 195, yPosition)
      yPosition += 10
      
      // Move to new page for utilities breakdown
      pdf.addPage()
      yPosition = 20
      
      // ==== SECTION 4: UTILITIES BREAKDOWN ====
      if (Object.keys(utilityBreakdown).length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...colors.accent)
        pdf.text('Utilities Breakdown', 15, yPosition)
        
        yPosition += 15
        
        // Sort utilities by amount
        const sortedUtilities = Object.entries(utilityBreakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10) // Show top 10 utilities
        
        // Two-column layout with proper spacing
        pdf.setFontSize(10)
        const midPoint = Math.ceil(sortedUtilities.length / 2)
        const leftUtils = sortedUtilities.slice(0, midPoint)
        const rightUtils = sortedUtilities.slice(midPoint)
        
        leftUtils.forEach(([utility, amount], index) => {
          const y = yPosition + index * 12
          
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...colors.text)
          const utilityName = cleanText(utility.substring(0, 20))
          pdf.text(utilityName, 15, y)
          
          pdf.setFont('helvetica', 'bold')
          pdf.text(`PKR ${amount.toLocaleString()}`, 70, y)
        })
        
        rightUtils.forEach(([utility, amount], index) => {
          const y = yPosition + index * 12
          
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...colors.text)
          const utilityName = cleanText(utility.substring(0, 20))
          pdf.text(utilityName, 110, y)
          
          pdf.setFont('helvetica', 'bold')
          pdf.text(`PKR ${amount.toLocaleString()}`, 165, y)
        })
        
        yPosition += Math.max(leftUtils.length, rightUtils.length) * 12 + 20
      }
      
      // ==== SECTION 5: EXPENSE LIST (Chronological, Recent at End) ====
      // Add divider if utilities were shown
      if (Object.keys(utilityBreakdown).length > 0) {
        pdf.setDrawColor(...colors.lightGray)
        pdf.line(15, yPosition, 195, yPosition)
        yPosition += 15
      }
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Monthly Expenses', 15, yPosition)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...colors.text)
      pdf.text('(Listed chronologically - most recent at the end)', 95, yPosition)
      
      yPosition += 12
      
      if (monthlyExpenses.length > 0) {
        // Group expenses by day
        const expensesByDay: Record<string, { expenses: any[], total: number }> = {}
        
        monthlyExpenses.forEach(expense => {
          const dateKey = new Date(expense.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })
          
          if (!expensesByDay[dateKey]) {
            expensesByDay[dateKey] = { expenses: [], total: 0 }
          }
          
          expensesByDay[dateKey].expenses.push(expense)
          expensesByDay[dateKey].total += expense.amount
        })
        
        // Sort days chronologically
        const sortedDays = Object.keys(expensesByDay).sort((a, b) => 
          new Date(a).getTime() - new Date(b).getTime()
        )
        
        // Check if autoTable is available
        
        if (typeof (pdf as any).autoTable === 'function') {
          const tableData: any[] = []
          
          // Create table data with daily groupings
          sortedDays.forEach(day => {
            const dayData = expensesByDay[day]
            
            // Group expenses by category for better summary
            const categoryBreakdown: Record<string, number> = {}
            dayData.expenses.forEach(exp => {
              const categoryLabel = categoryLabels[exp.category as keyof typeof categoryLabels] || exp.category
              categoryBreakdown[categoryLabel] = (categoryBreakdown[categoryLabel] || 0) + 1
            })
            
            // Create a summary of expenses
            const expenseSummary = Object.entries(categoryBreakdown)
              .map(([cat, count]) => `${cat}: ${count}`)
              .join(', ')
            
            // Get all expense descriptions
            const expenseDetails = dayData.expenses
              .map(exp => {
                const categoryLabel = categoryLabels[exp.category as keyof typeof categoryLabels] || exp.category
                return `${cleanText(exp.description)} (${categoryLabel})`
              })
              .join(', ')
            
            tableData.push([
              day,
              expenseDetails,
              dayData.expenses.length.toString(),
              `PKR ${dayData.total.toLocaleString()}`
            ])
          })
          
          // Add total row at the end
          tableData.push([
            'TOTAL',
            '',
            monthlyExpenses.length,
            `PKR ${totalAmount.toLocaleString()}`
          ])
          
          // Table data prepared
          
          // Use autoTable for the expenses table
          ;(pdf as any).autoTable({
            head: [['Date', 'Expenses', 'Count', 'Daily Total']],
            body: tableData,
            startY: yPosition,
            styles: { 
              fontSize: 11,
              cellPadding: 5,
              lineColor: [230, 230, 230],
              lineWidth: 0.3,
              overflow: 'linebreak' // Enable text wrapping
            },
            headStyles: { 
              fillColor: colors.primary,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 11
            },
            alternateRowStyles: {
              fillColor: [252, 252, 252]
            },
            columnStyles: {
              0: { cellWidth: 30 }, // Date
              1: { cellWidth: 100, cellPadding: 3 }, // Expenses with wrapping
              2: { cellWidth: 15, halign: 'center' }, // Count
              3: { cellWidth: 35, halign: 'right' } // Daily Total
            },
            rowPageBreak: 'avoid',
            margin: { left: 15, right: 15 },
            didParseCell: function(data: any) {
              // Style the total row
              if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold'
                data.cell.styles.fillColor = colors.background
              }
            }
          })
        } else {
          // Manual table creation fallback (autoTable not available)
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          
          // Table headers with colored background
          pdf.setFillColor(...colors.primary)
          pdf.rect(15, yPosition - 2, 180, 10, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.text('Date', 18, yPosition + 5)
          pdf.text('Expenses', 50, yPosition + 5)
          pdf.text('Count', 140, yPosition + 5)
          pdf.text('Daily Total', 165, yPosition + 5)
          
          yPosition += 18
          pdf.setTextColor(...colors.text)
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(10)
          
          sortedDays.forEach((day, index) => {
            const dayData = expensesByDay[day]
            
            // Get all expense descriptions  
            const expenseDetails = dayData.expenses
              .map(exp => {
                const categoryLabel = categoryLabels[exp.category as keyof typeof categoryLabels] || exp.category
                return `${cleanText(exp.description)} (${categoryLabel})`
              })
              .join(', ')
            
            // Split text to fit in width of 85 units (from x=50 to x=135)
            const lines = pdf.splitTextToSize(expenseDetails, 85)
            const rowHeight = Math.max(12, lines.length * 5 + 7)
            
            // Check if we need a new page
            if (yPosition + rowHeight > 270) {
              pdf.addPage()
              yPosition = 30
              // Re-add headers on new page
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'bold')
              pdf.setFillColor(...colors.primary)
              pdf.rect(15, yPosition - 2, 180, 10, 'F')
              pdf.setTextColor(255, 255, 255)
              pdf.text('Date', 18, yPosition + 5)
              pdf.text('Expenses', 50, yPosition + 5)
              pdf.text('Count', 140, yPosition + 5)
              pdf.text('Daily Total', 165, yPosition + 5)
              yPosition += 15
              pdf.setTextColor(...colors.text)
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(9)
            }
            
            // Alternate row colors with dynamic height
            if (index % 2 === 0) {
              pdf.setFillColor(252, 252, 252)
              pdf.rect(15, yPosition - 3, 180, rowHeight, 'F')
            }
            
            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'normal')
            pdf.text(day, 18, yPosition + 2)
            
            // Show wrapped expense details
            let textY = yPosition + 2
            lines.forEach((line: string, lineIndex: number) => {
              pdf.text(line, 50, textY + (lineIndex * 5))
            })
            
            pdf.text(dayData.expenses.length.toString(), 145, yPosition + 2)
            
            pdf.setFont('helvetica', 'bold')
            pdf.text(`PKR ${dayData.total.toLocaleString()}`, 165, yPosition + 2)
            pdf.setFont('helvetica', 'normal')
            
            yPosition += rowHeight
          })
          
          // Add total row
          if (yPosition > 260) {
            pdf.addPage()
            yPosition = 30
          }
          
          pdf.setFillColor(...colors.background)
          pdf.rect(15, yPosition - 2, 180, 12, 'F')
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...colors.text)
          pdf.text('TOTAL', 18, yPosition + 5)
          pdf.text('', 50, yPosition + 5)
          pdf.text(monthlyExpenses.length.toString(), 145, yPosition + 5)
          pdf.text(`PKR ${totalAmount.toLocaleString()}`, 165, yPosition + 5)
        }
      } else {
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(128, 128, 128)
        pdf.text('No expenses found for this month.', 15, yPosition + 10)
      }
      
      // ==== FINANCIAL ANALYSIS & RECOMMENDATIONS ====
      pdf.addPage()
      yPosition = 20
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Financial Analysis & Recommendations', 15, yPosition)
      
      yPosition += 15
      
      // Calculate financial ratios and insights
      const needsSpent = categoryTotals['NEED'] || 0
      const wantsSpent = categoryTotals['WANT'] || 0
      const selfDevSpent = categoryTotals['SELF_DEVELOPMENT'] || 0
      const savingsActual = optimisticMonthlySavings || 0
      
      // Use actual monthly income for 50/30/20 rule
      const hasIncome = monthlyIncome > 0
      
      // Calculate percentages based on income (50/30/20 rule)
      const needsPercent = hasIncome ? (needsSpent / monthlyIncome) * 100 : 0
      const wantsPercent = hasIncome ? (wantsSpent / monthlyIncome) * 100 : 0
      const selfDevPercent = hasIncome ? (selfDevSpent / monthlyIncome) * 100 : 0
      const savingsRate = hasIncome ? (savingsActual / monthlyIncome) * 100 : 0
      
      // Calculate ideal amounts based on 50/30/20 rule
      const idealNeeds = hasIncome ? monthlyIncome * 0.50 : 0
      const idealWants = hasIncome ? monthlyIncome * 0.30 : 0
      const idealSavings = hasIncome ? monthlyIncome * 0.20 : 0
      
      // Financial Health Assessment
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      pdf.text('Financial Health Assessment', 15, yPosition)
      yPosition += 12
      
      // Show monthly income
      if (hasIncome) {
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...colors.primary)
        pdf.text(`Monthly Income: PKR ${monthlyIncome.toLocaleString()}`, 15, yPosition)
        yPosition += 10
      } else {
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(...colors.danger)
        pdf.text('No income recorded for this month. Please add income to get accurate analysis.', 15, yPosition)
        yPosition += 10
      }
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...colors.text)
      
      // 50/30/20 Rule Analysis based on actual income
      pdf.text('• 50/30/20 Rule Analysis (Based on Your Income):', 15, yPosition)
      yPosition += 10
      
      const analysis = hasIncome ? [
        [`Needs (50% = PKR ${idealNeeds.toLocaleString()}):`, `Spent: PKR ${needsSpent.toLocaleString()} (${needsPercent.toFixed(1)}%)`, needsPercent <= 50 ? 'Excellent' : needsPercent <= 60 ? 'Good' : 'Over Budget'],
        [`Wants (30% = PKR ${idealWants.toLocaleString()}):`, `Spent: PKR ${wantsSpent.toLocaleString()} (${wantsPercent.toFixed(1)}%)`, wantsPercent <= 30 ? 'Excellent' : wantsPercent <= 40 ? 'Good' : 'Over Budget'],
        [`Savings (20% = PKR ${idealSavings.toLocaleString()}):`, `Saved: PKR ${savingsActual.toLocaleString()} (${savingsRate.toFixed(1)}%)`, savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement']
      ] : [
        [`Needs:`, `Spent: PKR ${needsSpent.toLocaleString()}`, 'No income to compare'],
        [`Wants:`, `Spent: PKR ${wantsSpent.toLocaleString()}`, 'No income to compare'],
        [`Savings:`, `Saved: PKR ${savingsActual.toLocaleString()}`, 'No income to compare']
      ]
      
      analysis.forEach(([metric, actual, status]) => {
        // Metric and ideal amount
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(metric, 25, yPosition)
        yPosition += 6
        
        // Actual spending on same line, indented
        pdf.setFontSize(9)
        pdf.text(actual, 35, yPosition)
        
        // Status aligned to the right
        const statusColor = status === 'Excellent' ? colors.success : 
                           status === 'Good' ? colors.warning : 
                           status === 'Over Budget' || status === 'Needs Improvement' ? colors.danger : colors.text
        pdf.setTextColor(...statusColor)
        pdf.setFont('helvetica', 'bold')
        
        // Get text width to right-align status
        const statusWidth = pdf.getTextWidth(status)
        pdf.text(status, 195 - statusWidth, yPosition)
        pdf.setTextColor(...colors.text)
        pdf.setFont('helvetica', 'normal')
        yPosition += 10
      })
      
      yPosition += 5
      
      // Add visual summary box if income exists
      if (hasIncome) {
        pdf.setDrawColor(...colors.primary)
        pdf.setLineWidth(0.5)
        pdf.rect(15, yPosition, 180, 32, 'S')
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Quick Summary:', 20, yPosition + 8)
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        
        // Left column
        pdf.text(`• Total Income: PKR ${monthlyIncome.toLocaleString()}`, 20, yPosition + 16)
        pdf.text(`• Net Balance: PKR ${(monthlyIncome - totalAmount).toLocaleString()}`, 20, yPosition + 24)
        
        // Right column
        pdf.text(`• Total Spent: PKR ${totalAmount.toLocaleString()}`, 105, yPosition + 16)
        pdf.text(`• Actual Savings: PKR ${savingsActual.toLocaleString()}`, 105, yPosition + 24)
        
        yPosition += 37
      }
      
      yPosition += 10
      
      // AI-Powered Recommendations Section
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...colors.accent)
      
      // Add AI health score if available
      if (aiInsights.healthScore) {
        pdf.text(`AI Financial Health Score: ${aiInsights.healthScore}`, 15, yPosition)
        yPosition += 10
      }
      
      pdf.text('AI-Powered Smart Recommendations', 15, yPosition)
      yPosition += 10
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...colors.text)
      
      const recommendations: string[] = []
      
      // Use AI recommendations if available
      if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
        // Add AI concerns first (if any)
        if (aiInsights.concerns && aiInsights.concerns.length > 0) {
          aiInsights.concerns.forEach(concern => {
            recommendations.push(`⚠️ ${concern}`)
          })
        }
        
        // Add AI recommendations
        aiInsights.recommendations.forEach(rec => {
          recommendations.push(`💡 ${rec}`)
        })
        
        // Add positive observations
        if (aiInsights.positives && aiInsights.positives.length > 0) {
          aiInsights.positives.forEach(positive => {
            recommendations.push(`✅ ${positive}`)
          })
        }
      } else {
        // Fallback to rule-based recommendations if AI is not available
        if (hasIncome) {
          // Income-based recommendations using 50/30/20 rule
          const needsDiff = needsSpent - idealNeeds
          const wantsDiff = wantsSpent - idealWants
          const savingsDiff = savingsActual - idealSavings
          
          // Needs recommendations (50% rule)
          if (needsPercent > 50) {
            recommendations.push(`Needs overspending: ${needsPercent.toFixed(1)}% (target: 50%). Cut PKR ${needsDiff.toLocaleString()}`)
            if (needsPercent > 60) {
              recommendations.push('Review essential expenses for cheaper alternatives')
            }
          } else if (needsPercent < 40) {
            recommendations.push(`Great job on needs! Under budget by PKR ${Math.abs(needsDiff).toLocaleString()}`)
          }
          
          // Wants recommendations (30% rule)
          if (wantsPercent > 30) {
            recommendations.push(`Wants overspending: ${wantsPercent.toFixed(1)}% (target: 30%). Reduce by PKR ${wantsDiff.toLocaleString()}`)
          } else if (wantsPercent < 20) {
            recommendations.push(`Excellent wants control! Saved PKR ${Math.abs(wantsDiff).toLocaleString()}`)
          }
          
          // Savings recommendations (20% rule)
          if (savingsRate < 20) {
            recommendations.push(`Low savings: ${savingsRate.toFixed(1)}% (target: 20%). Increase by PKR ${Math.abs(savingsDiff).toLocaleString()}`)
            if (savingsRate < 10) {
              recommendations.push('Set up automatic transfers for 20% savings')
            }
          } else if (savingsRate >= 20) {
            recommendations.push(`Excellent savings rate of ${savingsRate.toFixed(1)}%!`)
          }
        } else {
          recommendations.push('Record monthly income for personalized recommendations')
          recommendations.push('Follow 50/30/20 rule: 50% needs, 30% wants, 20% savings')
        }
        
        // Budget overrun recommendations
        Object.entries(categoryTotals).forEach(([category, spent]) => {
          const budget = budgetGoals[category as keyof typeof budgetGoals] || 0
          if (budget > 0 && spent > budget) {
            const overage = spent - budget
            const categoryName = categoryLabels[category as keyof typeof categoryLabels] || category
            recommendations.push(`${categoryName} budget exceeded by PKR ${overage.toLocaleString()}`)
          }
        })
      }
      
      // Display recommendations with better formatting
      recommendations.forEach((rec, index) => {
        // Check if we need a new page before starting a recommendation
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }
        
        // Remove emojis and clean the text for better PDF rendering
        const cleanRec = rec
          .replace(/[🔴🟡✅💡⚠️💰📊]/g, '') // Remove emojis
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim()
        
        // Determine the type of recommendation for color coding
        let textColor = colors.text
        if (rec.includes('🔴') || rec.includes('CRITICAL') || rec.includes('OVERSPENDING')) {
          textColor = colors.danger
        } else if (rec.includes('✅') || rec.includes('Excellent') || rec.includes('Great')) {
          textColor = colors.success
        } else if (rec.includes('🟡') || rec.includes('⚠️')) {
          textColor = colors.warning
        } else if (rec.includes('💡')) {
          textColor = colors.primary
        }
        
        pdf.setTextColor(...textColor)
        
        // Split text to fit width
        const lines = pdf.splitTextToSize(cleanRec, 170)
        
        lines.forEach((line: string, lineIndex: number) => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          
          if (lineIndex === 0) {
            // Add bullet point for first line
            pdf.setFont('helvetica', 'bold')
            pdf.text('•', 15, yPosition)
            pdf.setFont('helvetica', 'normal')
            pdf.text(line, 20, yPosition)
          } else {
            // Indent continuation lines
            pdf.text(line, 20, yPosition)
          }
          yPosition += 6
        })
        
        pdf.setTextColor(...colors.text) // Reset color
        yPosition += 3 // Gap between recommendations
      })
      
      // Footer on all pages with disclaimer
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        
        // Footer line
        pdf.setDrawColor(...colors.lightGray)
        pdf.setLineWidth(0.3)
        pdf.line(15, 278, 195, 278)
        
        // Disclaimer text
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(150, 150, 150)
        const disclaimer = 'This PDF is system-generated and may contain errors. Please verify all calculations.'
        const disclaimerWidth = pdf.getTextWidth(disclaimer)
        pdf.text(disclaimer, (210 - disclaimerWidth) / 2, 283) // Center the disclaimer
        
        // Footer info
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 15, 289)
        
        // Page number centered
        const pageText = `Page ${i} of ${pageCount}`
        const pageTextWidth = pdf.getTextWidth(pageText)
        pdf.text(pageText, (210 - pageTextWidth) / 2, 289)
        
        // Expensey copyright right-aligned
        pdf.text('Expensey © 2024', 155, 289)
      }
      
      // Save the PDF
      const fileName = `expensey-${monthName.replace(/\s+/g, '-').toLowerCase()}.pdf`
      pdf.save(fileName)
      toast.dismiss() // Dismiss loading toast
      const hasAI = aiInsights.recommendations && aiInsights.recommendations.length > 0
      toast.success(hasAI ? 'PDF exported with AI insights!' : 'PDF exported successfully!')
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.dismiss() // Dismiss loading toast
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  // Pagination calculations
  const filteredExpenses = getFilteredExpenses()
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  // Reset to page 1 when month or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedYear, dateFilter, selectedDate])

  // Render function for Recent Expenses content
  const renderExpensesContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.4,
        ease: "easeOut",
        scale: { duration: 0.3 }
      }}
    >
      {/* Recent Expenses Card */}
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 dark:from-green-500/10 dark:to-blue-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 shadow-lg"
            >
              <Receipt className="h-5 w-5 text-white" />
            </motion.div>
            <CardTitle className="text-base sm:text-xl">Recent Expenses</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExpenses(!showExpenses)}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: showExpenses ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="h-4 w-4"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            {showExpenses ? 'Hide Expenses' : 'Show Expenses'}
          </Button>
        </div>
        {showExpenses && (
          <>
            <CardDescription>Your expense history for {monthName}</CardDescription>
            
            {/* Date Filter Controls */}
            <div className="space-y-3 mt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">View:</Label>
                  <Select
                    value={dateFilter}
                    onValueChange={(value: 'day' | 'week' | 'month') => {
                      setDateFilter(value)
                      setCurrentPage(1) // Reset pagination
                    }}
                  >
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateFilter === 'day' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Label className="text-sm font-medium">Date:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px]",
                            "h-9 justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0" 
                        align="start"
                        sideOffset={5}
                        alignOffset={-20}
                      >
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date)
                              setCurrentPage(1) // Reset pagination
                            }
                          }}
                          defaultMonth={new Date(selectedYear, selectedMonth - 1)}
                          initialFocus
                          disabled={(date) => {
                            // Disable future dates and dates outside the selected month
                            const today = new Date()
                            today.setHours(23, 59, 59, 999)
                            return date > today || 
                                   date.getMonth() + 1 !== selectedMonth || 
                                   date.getFullYear() !== selectedYear
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )}
                
                {dateFilter === 'week' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Label className="text-sm font-medium">Week:</Label>
                    <Select
                      value={selectedWeek.toString()}
                      onValueChange={(value) => {
                        setSelectedWeek(parseInt(value))
                        setCurrentPage(1) // Reset pagination
                      }}
                    >
                      <SelectTrigger className="w-[200px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(week => {
                          const { start, end } = getWeekBoundaries(week, selectedMonth, selectedYear)
                          const isDisabled = isWeekInFuture(week, selectedMonth, selectedYear)
                          return (
                            <SelectItem 
                              key={week} 
                              value={week.toString()}
                              disabled={isDisabled}
                            >
                              Week {week} ({format(start, "MMM d")} - {format(end, "MMM d")})
                              {isDisabled && " (Future)"}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </div>
              
              {/* Filter Summary - on separate line */}
              {dateFilter !== 'month' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                  {dateFilter === 'week' && (
                    <span className="ml-1">
                      for Week {selectedWeek} of {format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy")}
                    </span>
                  )}
                  {dateFilter === 'day' && (
                    <span className="ml-1">
                      for {format(selectedDate, "MMMM d, yyyy")}
                    </span>
                  )}
                </motion.div>
              )}
            </div>
          </>
        )}
      </CardHeader>
      <AnimatePresence>
        {showExpenses && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: "easeInOut" },
              opacity: { duration: 0.3, ease: "easeInOut" }
            }}
            className="overflow-hidden"
          >
            <CardContent className="relative z-10" id="expenses-content">
              {monthLoading && !optimisticUpdateActive ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading expenses...</span>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {dateFilter === 'day' 
                    ? `No expenses for ${format(selectedDate, "PPP")}`
                    : dateFilter === 'week'
                    ? `No expenses for Week ${selectedWeek} of ${format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy")}`
                    : "No expenses yet. Add your first expense above!"
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {paginatedExpenses.map((expense, index) => {
                    const isOptimistic = typeof expense.id === 'string' && expense.id.startsWith('temp-')
                    return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: isOptimistic ? 1 : 1.01 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isOptimistic 
                      ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 animate-pulse' 
                      : 'bg-white/30 dark:bg-white/5 border-white/20'
                  } backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${isOptimistic ? '' : 'cursor-pointer'} relative`}
                  onClick={() => !isOptimistic && handleExpenseClick(expense)}
                >
                  {isOptimistic && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-sm sm:text-base font-medium">{expense.description}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full ${categoryConfig[expense.category].bgColor} ${categoryConfig[expense.category].textColor} font-medium`}>
                        {categoryConfig[expense.category].label}
                      </span>
                      {expense.subcategory && (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {expense.subcategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(expense.date)} at {formatTime(expense.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-base sm:text-lg font-semibold bg-gradient-to-r ${categoryConfig[expense.category].color} bg-clip-text text-transparent`}>
                      {formatAmount(expense.amount, expense.currency || 'PKR')}
                    </p>
                    {expense.receipt && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadReceipt(expense)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="Download receipt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                    {!isOptimistic && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(expense)
                          }}
                          disabled={deletingExpenseId === expense.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          {deletingExpenseId === expense.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )})}
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredExpenses.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} expenses
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show only a few page numbers around current page
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="h-8 w-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-1">...</span>
                        }
                        return null
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Hide button at the bottom */}
              <div className="flex justify-center mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById('expenses-content');
                    if (element) {
                      element.style.transition = 'all 0.4s ease-in-out';
                      element.style.opacity = '0';
                      element.style.transform = 'translateY(-10px)';
                    }
                    setTimeout(() => setShowExpenses(false), 300);
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-4 w-4" />
                  Hide Recent Expenses
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
    </motion.div>
  )

  // Render function for Visualization content
  const renderVisualizationContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.4,
        ease: "easeOut",
        scale: { duration: 0.3 }
      }}
    >
      <div className="space-y-6">
        {/* Analytics & Insights Chart */}
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg"
              >
                <BarChart3 className="h-5 w-5 text-white" />
              </motion.div>
              <CardTitle className="text-base sm:text-xl">Category Analytics</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: showCharts ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="h-4 w-4"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </Button>
          </div>
          {showCharts && (
            <CardDescription>Visual representation of your financial data</CardDescription>
          )}
        </CardHeader>
        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.4, ease: "easeInOut" },
                opacity: { duration: 0.3, ease: "easeInOut" }
              }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-6 relative z-10" id="analytics-content">
                {monthLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading analytics...</span>
                  </div>
                ) : (
                  <>
                    <ExpenseCharts expenses={expenses} />
                    <SavingsChart />
                  </>
                )}
                
                {/* Hide button at the bottom */}
                <div className="flex justify-center pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const element = document.getElementById('analytics-content');
                      if (element) {
                        element.style.transition = 'all 0.4s ease-in-out';
                        element.style.opacity = '0';
                        element.style.transform = 'translateY(-10px)';
                      }
                      setTimeout(() => setShowCharts(false), 300);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="h-4 w-4" />
                    Hide Analytics
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Utility Analytics Chart */}
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 dark:from-orange-500/10 dark:to-yellow-500/10" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg"
              >
                <Zap className="h-5 w-5 text-white" />
              </motion.div>
              <CardTitle className="text-base sm:text-xl">Utility Analytics</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUtilityCharts(!showUtilityCharts)}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: showUtilityCharts ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="h-4 w-4"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              {showUtilityCharts ? 'Hide Charts' : 'Show Charts'}
            </Button>
          </div>
          {showUtilityCharts && (
            <CardDescription>Breakdown of your spending by utility type</CardDescription>
          )}
        </CardHeader>
        <AnimatePresence>
          {showUtilityCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.4, ease: "easeInOut" },
                opacity: { duration: 0.3, ease: "easeInOut" }
              }}
              className="overflow-hidden"
            >
              <CardContent className="relative z-10" id="utility-content">
                {monthLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading utility analytics...</span>
                  </div>
                ) : (
                  <UtilityCharts expenses={expenses} />
                )}
                
                {/* Hide button at the bottom */}
                <div className="flex justify-center mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const element = document.getElementById('utility-content');
                      if (element) {
                        element.style.transition = 'all 0.4s ease-in-out';
                        element.style.opacity = '0';
                        element.style.transform = 'translateY(-10px)';
                      }
                      setTimeout(() => setShowUtilityCharts(false), 300);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="h-4 w-4" />
                    Hide Utility Analytics
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
    </motion.div>
  )

  // Render function for Budget content
  const renderBudgetContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.4,
        ease: "easeOut",
        scale: { duration: 0.3 }
      }}
    >
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg"
          >
            <Target className="h-5 w-5 text-white" />
          </motion.div>
          <CardTitle className="text-lg sm:text-xl">Budget Overview</CardTitle>
        </div>
        <CardDescription>
          Track your spending against your monthly budget
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        {monthLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-muted-foreground">Loading budget data...</span>
          </div>
        ) : !budget ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No budget set for {monthName}</p>
            <BudgetDialog 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear}
              onBudgetUpdated={() => {
                fetchBudget()
                fetchExpenses()
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Budget Progress Indicators */}
            {Object.entries(categoryConfig).map(([key, config], index) => {
              const budgetKey = key === 'NEED' ? 'needBudget' : 
                               key === 'WANT' ? 'wantBudget' : 
                               key === 'SELF_DEVELOPMENT' ? 'selfDevelopmentBudget' : 
                               'savingsBudget'
              const budgetAmount = budget[budgetKey as keyof typeof budget] || 0
              const spentAmount = expensesByCategory[key] || 0
              const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
              const isOverBudget = percentage > 100
              const isSavings = key === 'SAVINGS'
              
              // For savings, we want to show progress towards the minimum goal
              const savingsPercentage = isSavings && budgetAmount > 0 ? 
                Math.min((spentAmount / budgetAmount) * 100, 100) : percentage

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${config.color} shadow-sm`}>
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-medium">{config.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(spentAmount, 'PKR')} / {formatAmount(budgetAmount, 'PKR')}
                          {isSavings && spentAmount >= budgetAmount && (
                            <span className="text-green-600 dark:text-green-400 ml-2">✓ Goal met!</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base sm:text-lg font-semibold ${
                        isOverBudget && !isSavings ? 'text-red-600 dark:text-red-400' : 
                        isSavings && spentAmount >= budgetAmount ? 'text-green-600 dark:text-green-400' :
                        'text-muted-foreground'
                      }`}>
                        {isSavings ? savingsPercentage.toFixed(0) : percentage.toFixed(0)}%
                      </p>
                      {isOverBudget && !isSavings && (
                        <div className="space-y-1">
                          <p className="text-xs text-red-600 dark:text-red-400">Over budget</p>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            +{formatAmount(spentAmount - budgetAmount, 'PKR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={isSavings ? savingsPercentage : Math.min(percentage, 100)} 
                      className={`h-3 ${
                        isOverBudget && !isSavings ? 'bg-red-100 dark:bg-red-900/20' : 
                        'bg-gray-100 dark:bg-gray-800'
                      }`}
                    />
                    {isOverBudget && !isSavings && (
                      <>
                        <div 
                          className="absolute top-0 right-0 h-3 bg-red-600 dark:bg-red-400 rounded-r animate-pulse"
                          style={{ width: `${Math.min((percentage - 100) * 0.5, 50)}%` }}
                        />
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-red-600 dark:bg-red-400 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                          <span className="font-medium">+{((percentage - 100).toFixed(0))}%</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {isSavings && (
                    <p className="text-xs text-muted-foreground">
                      {spentAmount >= budgetAmount ? 
                        `You've saved ${formatAmount(spentAmount - budgetAmount, 'PKR')} more than your minimum goal!` :
                        `${formatAmount(budgetAmount - spentAmount, 'PKR')} more to reach your minimum savings goal`
                      }
                    </p>
                  )}
                </motion.div>
              )
            })}
            
            {/* Total Budget Summary */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-semibold">Total Budget Summary</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAmounts(!showAmounts)}
                  className="h-8 w-8 p-0"
                >
                  {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-base sm:text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {formatAmount(
                      (budget.needBudget || 0) + 
                      (budget.wantBudget || 0) + 
                      (budget.selfDevelopmentBudget || 0),
                      'PKR'
                    )}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-base sm:text-xl font-semibold text-green-600 dark:text-green-400">
                    {formatAmount(totalExpenses, 'PKR')}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`text-base sm:text-xl font-semibold ${
                    totalExpenses > ((budget.needBudget || 0) + (budget.wantBudget || 0) + (budget.selfDevelopmentBudget || 0)) ?
                    'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {formatAmount(
                      ((budget.needBudget || 0) + (budget.wantBudget || 0) + (budget.selfDevelopmentBudget || 0)) - totalExpenses,
                      'PKR'
                    )}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  )

  if (loading && !optimisticUpdateActive) {
    return (
      <Card className="w-full backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading expenses...</div>
        </CardContent>
      </Card>
    )
  }


  return (
    <div className="space-y-6">
      {/* Monthly Summary Card */}
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
        
        <CardHeader className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </motion.div>
              <CardTitle className="text-lg sm:text-2xl">Monthly Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAmounts(!showAmounts)}
                className="h-8 w-8 p-0"
                title={showAmounts ? "Hide amounts" : "Show amounts"}
              >
                {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Month Selector Button */}
              <Button
                variant="ghost"
                className="flex items-center gap-1 sm:gap-2 min-w-[100px] sm:min-w-[180px] justify-center hover:bg-accent px-1 sm:px-4"
                onClick={() => setShowMonthPicker(true)}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">{monthName}</span>
              </Button>
              
              {/* Month Picker - Dialog for mobile, Popover for desktop */}
              {isMobile ? (
                <Dialog open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Select Month & Year</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Month</Label>
                        <Select
                          value={selectedMonth.toString()}
                          onValueChange={(value) => {
                            setSelectedMonth(parseInt(value))
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => {
                              const isAvailable = hasDataForMonth(month.value, selectedYear)
                              return (
                                <SelectItem 
                                  key={month.value} 
                                  value={month.value.toString()}
                                  disabled={!isAvailable}
                                >
                                  {month.label} {!isAvailable && '(No data)'}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Year</Label>
                        <Select
                          value={selectedYear.toString()}
                          onValueChange={(value) => {
                            setSelectedYear(parseInt(value))
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => {
                              const hasAnyData = year === currentYear || availableMonths.some(am => am.year === year)
                              return (
                                <SelectItem 
                                  key={year} 
                                  value={year.toString()}
                                  disabled={!hasAnyData}
                                >
                                  {year} {!hasAnyData && '(No data)'}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowMonthPicker(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setSelectedMonth(currentMonth)
                          setSelectedYear(currentYear)
                          setShowMonthPicker(false)
                        }}
                      >
                        Current Month
                      </Button>
                      <Button
                        onClick={() => setShowMonthPicker(false)}
                      >
                        Apply
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="sr-only"
                    >
                      Open
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[320px] p-4" 
                    align="center"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Month</Label>
                        <Select
                          value={selectedMonth.toString()}
                          onValueChange={(value) => {
                            setSelectedMonth(parseInt(value))
                            setShowMonthPicker(false)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => {
                              const isAvailable = hasDataForMonth(month.value, selectedYear)
                              return (
                                <SelectItem 
                                  key={month.value} 
                                  value={month.value.toString()}
                                  disabled={!isAvailable}
                                >
                                  {month.label} {!isAvailable && '(No data)'}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Year</Label>
                        <Select
                          value={selectedYear.toString()}
                          onValueChange={(value) => {
                            setSelectedYear(parseInt(value))
                            setShowMonthPicker(false)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => {
                              const hasAnyData = year === currentYear || availableMonths.some(am => am.year === year)
                              return (
                                <SelectItem 
                                  key={year} 
                                  value={year.toString()}
                                  disabled={!hasAnyData}
                                >
                                  {year} {!hasAnyData && '(No data)'}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowMonthPicker(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedMonth(currentMonth)
                            setSelectedYear(currentYear)
                            setShowMonthPicker(false)
                          }}
                        >
                          Current Month
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={!canGoNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(currentMonth)
                    setSelectedYear(currentYear)
                  }}
                  className="ml-1 sm:ml-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Today
                </Button>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={filteredExpenses.length === 0 && optimisticMonthlySavings === 0}
                  className="relative flex items-center gap-2 ml-1 sm:ml-2 text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-300/50 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-green-500/20 dark:hover:shadow-green-400/20 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title={filteredExpenses.length === 0 && optimisticMonthlySavings === 0 ? "No data available for export" : "Export monthly summary as PDF"}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  <motion.div
                    animate={{ 
                      y: [0, -2, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <FileDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors relative z-10" />
                  </motion.div>
                  <span className="hidden sm:inline font-medium text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors relative z-10">Export PDF</span>
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
                    <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardDescription className="text-xs sm:text-sm">Your spending breakdown for {monthName}</CardDescription>
            <BudgetDialog 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear}
              onBudgetUpdated={() => {
                fetchBudget()
                fetchExpenses()
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {monthLoading && !optimisticUpdateActive ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-muted-foreground">Loading {monthName} data...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Main expense breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-800/30 dark:to-gray-700/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                  {formatAmount(totalExpenses, 'PKR')}
                </p>
              </motion.div>
              {Object.entries(categoryConfig).filter(([key]) => key !== 'SAVINGS').map(([key, config], index) => (
                <motion.div 
                  key={key} 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-100/30 to-gray-200/30 dark:from-gray-800/20 dark:to-gray-700/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
                  <p className={`text-base sm:text-xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {formatAmount(expensesByCategory[key] || 0, 'PKR')}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Savings section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Savings Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 relative group border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' })} Savings
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenEditMonthlySavings}
                      className="h-7 w-7 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                      title={`Edit ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' })} Savings`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-base sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatAmount(optimisticMonthlySavings, 'PKR')}
                  </p>
                </motion.div>
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative group border border-green-500/20 hover:border-green-500/40 transition-all shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground">Lifetime Savings</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenEditLifetimeSavings}
                      className="h-7 w-7 text-green-600 dark:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="Edit Lifetime Savings"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-base sm:text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatAmount(totalSavings, 'PKR')}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
          )}
        </CardContent>
        
        {/* Decorative element */}
        <motion.div
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </Card>

      {/* Mobile Navigation Buttons */}
      {isMobile && activeView !== 'expenses' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 z-50"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('expenses')}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </motion.div>
      )}

      {/* Render appropriate content */}
      {isMobile ? (
        // Mobile View - Show one section at a time
        <div className="space-y-6">
          {/* Mobile Quick Access Buttons - Only show on expenses view */}
          {activeView === 'expenses' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setActiveView('finance')}
                    className="h-24 w-full flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-[oklch(0.25_0.02_250)]/50 transition-colors"
                  >
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium">Finance</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setActiveView('visualization')}
                    className="h-24 w-full flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-[oklch(0.25_0.02_250)]/50 transition-colors"
                  >
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium">Charts</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setActiveView('ai')}
                    className="h-24 w-full flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-[oklch(0.25_0.02_250)]/50 transition-colors"
                  >
                    <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium">AI Insights</span>
                  </Button>
                </motion.div>
              </div>
              
              {/* Utilities button */}
              {onOpenUtilities && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={onOpenUtilities}
                    className="h-24 w-full flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-[oklch(0.25_0.02_250)]/50 transition-colors"
                  >
                    <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium">Manage Utilities</span>
                  </Button>
                </motion.div>
              )}
            </>
          )}
          
          {/* Mobile Content - Conditional rendering based on activeView */}
          {activeView === 'expenses' && renderExpensesContent()}
          {activeView === 'finance' && (
            <FinanceOverview 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              showAmounts={showAmounts}
              onToggleAmounts={() => setShowAmounts(!showAmounts)}
            />
          )}
          {activeView === 'visualization' && renderVisualizationContent()}
          {activeView === 'ai' && <AIInsights month={selectedMonth} year={selectedYear} />}
        </div>
      ) : (
        // Desktop View - Keep existing tabs structure
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="w-full bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <TabsTrigger value="expenses" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <Receipt className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {renderExpensesContent()}
          </TabsContent>

          <TabsContent value="finance">
            <FinanceOverview 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              showAmounts={showAmounts}
              onToggleAmounts={() => setShowAmounts(!showAmounts)}
            />
          </TabsContent>

          <TabsContent value="visualization">
            {renderVisualizationContent()}
          </TabsContent>

          <TabsContent value="ai">
            <AIInsights month={selectedMonth} year={selectedYear} />
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteExpenseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        expense={expenseToDelete ? {
          description: expenseToDelete.description,
          amount: expenseToDelete.amount,
          currency: expenseToDelete.currency || 'PKR',
          category: expenseToDelete.category
        } : null}
        showAmounts={showAmounts}
      />

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        expense={selectedExpense}
        showAmounts={showAmounts}
        onDelete={handleDeleteFromDetails}
        onUpdate={() => {
          fetchExpenses()
          setSelectedExpense(null)
          setDetailsDialogOpen(false)
        }}
      />

      {/* Edit Monthly Savings Dialog */}
      <Dialog open={isEditingMonthlySavings} onOpenChange={setIsEditingMonthlySavings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <PiggyBank className="h-5 w-5" />
              Edit {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Savings
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMonthlySavings} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="monthlySavingsInput">Savings Amount (PKR)</Label>
              <Input
                id="monthlySavingsInput"
                type="number"
                step="0.01"
                min="0"
                value={monthlySavingsInput}
                onChange={(e) => setMonthlySavingsInput(e.target.value)}
                placeholder="Enter savings amount"
                required
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingMonthlySavings(false)}
                disabled={savingSavingsLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                disabled={savingSavingsLoading}
              >
                {savingSavingsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lifetime Savings Dialog */}
      <Dialog open={isEditingLifetimeSavings} onOpenChange={setIsEditingLifetimeSavings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="h-5 w-5" />
              Edit Lifetime Savings
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLifetimeSavings} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="lifetimeSavingsInput">Total Lifetime Savings (PKR)</Label>
              <Input
                id="lifetimeSavingsInput"
                type="number"
                step="0.01"
                min="0"
                value={lifetimeSavingsInput}
                onChange={(e) => setLifetimeSavingsInput(e.target.value)}
                placeholder="Enter overall total savings"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                This updates your overall baseline savings across all tracked and prior months.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingLifetimeSavings(false)}
                disabled={savingSavingsLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                disabled={savingSavingsLoading}
              >
                {savingSavingsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}