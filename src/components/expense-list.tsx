'use client'

import { useState, useEffect } from 'react'
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
import { ChevronDown, ChevronUp, BarChart3, ChevronLeft, ChevronRight, Calendar, Receipt, Zap, Eye, EyeOff, TrendingUp, PiggyBank, Wallet, Trash2, X, Target, Download, Loader2, Menu, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetDialog } from './budget-dialog'
import { Progress } from '@/components/ui/progress'
import { formatCurrencyWithMask } from '@/lib/currency'
import { DeleteExpenseDialog } from './delete-expense-dialog'
import { ExpenseDetailsDialog } from './expense-details-dialog'

interface ExpenseListProps {
  refreshTrigger: number
  onOpenUtilities?: () => void
}

export function ExpenseList({ refreshTrigger, onOpenUtilities }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthlySavings, setMonthlySavings] = useState<number>(0)
  const [totalSavings, setTotalSavings] = useState<number>(0)
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
  const [activeView, setActiveView] = useState<'expenses' | 'budget' | 'visualization'>('expenses')
  
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
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter expenses based on date filter selection
  const getFilteredExpenses = () => {
    if (dateFilter === 'month') {
      return expenses
    }
    
    return expenses.filter(expense => {
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
  

  useEffect(() => {
    const fetchMonthData = async () => {
      // Only show month loading if it's a month/year change, not initial load or refresh
      if (!loading) {
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

  const totalExpenses = expenses
    .filter(expense => expense.category !== 'SAVINGS')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

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
              {monthLoading ? (
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
                  {paginatedExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-4 rounded-2xl border bg-white/30 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleExpenseClick(expense)}
                >
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
                  </div>
                </motion.div>
              ))}
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

  if (loading) {
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
          {monthLoading ? (
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
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' })} Savings
                  </p>
                  <p className="text-base sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatAmount(monthlySavings, 'PKR')}
                  </p>
                </motion.div>
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <p className="text-sm text-muted-foreground">Lifetime Savings</p>
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
                    onClick={() => setActiveView('budget')}
                    className="h-24 w-full flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-[oklch(0.25_0.02_250)]/50 transition-colors"
                  >
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium">Budget Overview</span>
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
                    <span className="text-xs font-medium">Visualization</span>
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
          {activeView === 'budget' && renderBudgetContent()}
          {activeView === 'visualization' && renderVisualizationContent()}
        </div>
      ) : (
        // Desktop View - Keep existing tabs structure
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="w-full bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <TabsTrigger value="expenses" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <Receipt className="w-4 h-4 mr-2" />
              Recent Expenses
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <Target className="w-4 h-4 mr-2" />
              Budget Overview
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
              <BarChart3 className="w-4 h-4 mr-2" />
              Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {renderExpensesContent()}
          </TabsContent>

          <TabsContent value="visualization">
            {renderVisualizationContent()}
          </TabsContent>

          <TabsContent value="budget">
            {renderBudgetContent()}
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
    </div>
  )
}