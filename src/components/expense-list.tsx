'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Expense } from '@/generated/prisma'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ExpenseCharts } from './expense-charts'
import { SavingsChart } from './savings-chart'
import { UtilityCharts } from './utility-charts'
import { ChevronDown, ChevronUp, BarChart3, ChevronLeft, ChevronRight, Calendar, Receipt, Zap, Eye, EyeOff, TrendingUp, PiggyBank, Wallet, Trash2, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ExpenseListProps {
  refreshTrigger: number
}

export function ExpenseList({ refreshTrigger }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlySavings, setMonthlySavings] = useState<number>(0)
  const [totalSavings, setTotalSavings] = useState<number>(0)
  const [showCharts, setShowCharts] = useState(false)
  const [showUtilityCharts, setShowUtilityCharts] = useState(false)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showAmounts, setShowAmounts] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<{year: number, month: number}[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
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
  

  useEffect(() => {
    fetchExpenses()
    fetchSavings()
  }, [refreshTrigger, selectedMonth, selectedYear])

  useEffect(() => {
    fetchAvailableMonths()
  }, [refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      fetchExpenses()
      fetchSavings() // Refresh savings in case a SAVINGS expense was deleted
      toast.success('Expense deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  const categoryConfig = {
    NEED: { 
      label: 'Need',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-300'
    },
    WANT: {
      label: 'Want',
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

  const formatAmount = (amount: number) => {
    if (showAmounts) {
      return `PKR ${amount.toFixed(0)}`
    }
    return 'PKR ****'
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
  const totalPages = Math.ceil(expenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = expenses.slice(startIndex, endIndex)

  // Reset to page 1 when month changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedYear])

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg"
              >
                <TrendingUp className="h-5 w-5 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Monthly Summary</CardTitle>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 min-w-[180px] justify-center hover:bg-accent"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">{monthName}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="center">
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
                  className="ml-2"
                >
                  Today
                </Button>
              )}
            </div>
          </div>
          <CardDescription>Your spending breakdown for {monthName}</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
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
                <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                  {formatAmount(totalExpenses)}
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
                  <p className={`text-xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {formatAmount(expensesByCategory[key] || 0)}
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
                  <p className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatAmount(monthlySavings)}
                  </p>
                </motion.div>
                <motion.div 
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <p className="text-sm text-muted-foreground">Lifetime Savings</p>
                  <p className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatAmount(totalSavings)}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
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

      {/* Tabs for Recent Expenses and Visualization & Insights */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="w-full bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 backdrop-blur-xl border border-white/20 dark:border-white/10">
          <TabsTrigger value="expenses" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
            <Receipt className="w-4 h-4 mr-2" />
            Recent Expenses
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex-1 data-[state=active]:bg-white/60 dark:data-[state=active]:bg-[oklch(0.25_0.02_250)]/50">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visualization & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
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
                  <CardTitle className="text-xl">Recent Expenses</CardTitle>
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
                <CardDescription>Your expense history for {monthName}</CardDescription>
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
                    {expenses.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No expenses yet. Add your first expense above!
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
                        className="flex items-center justify-between p-4 rounded-2xl border bg-white/30 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-medium">{expense.description}</h4>
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
                          <p className={`text-lg font-semibold bg-gradient-to-r ${categoryConfig[expense.category].color} bg-clip-text text-transparent`}>
                            {formatAmount(expense.amount)}
                          </p>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                      </div>
                    )}
                    
                    {/* Pagination Controls */}
                    {expenses.length > itemsPerPage && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, expenses.length)} of {expenses.length} expenses
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
        </TabsContent>

        <TabsContent value="visualization">
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
                    <CardTitle className="text-xl">Analytics & Insights</CardTitle>
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
                      <ExpenseCharts expenses={expenses} />
                      <SavingsChart />
                      
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
                    <CardTitle className="text-xl">Utility Analytics</CardTitle>
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
                      <UtilityCharts expenses={expenses} />
                      
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
        </TabsContent>
      </Tabs>
    </div>
  )
}