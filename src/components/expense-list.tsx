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
import { ChevronDown, ChevronUp, BarChart3, ChevronLeft, ChevronRight, Calendar, Receipt, Zap, Eye, EyeOff } from 'lucide-react'

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
  const [showExpenses, setShowExpenses] = useState(true)
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

  const categoryColors = {
    NEED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    WANT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    SELF_DEVELOPMENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    SAVINGS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  }

  const categoryLabels = {
    NEED: 'Need',
    WANT: 'Want',
    SELF_DEVELOPMENT: 'Self Development',
    SAVINGS: 'Savings',
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
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading expenses...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CardTitle>Monthly Summary</CardTitle>
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
        <CardContent>
          <div className="space-y-6">
            {/* Main expense breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
              </div>
              {Object.entries(categoryLabels).filter(([key]) => key !== 'SAVINGS').map(([key, label]) => (
                <div key={key} className="text-center">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold">
                    {formatAmount(expensesByCategory[key] || 0)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Savings section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Savings Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' })} Savings
                  </p>
                  <p className="text-xl font-semibold text-purple-600">{formatAmount(monthlySavings)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Lifetime Total</p>
                  <p className="text-xl font-semibold text-green-600">{formatAmount(totalSavings)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section with Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Analytics & Insights</CardTitle>
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
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <ExpenseCharts expenses={expenses} />
                </motion.div>
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <SavingsChart />
                </motion.div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Utility Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <CardTitle>Utility Analytics</CardTitle>
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
              <CardContent>
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <UtilityCharts expenses={expenses} />
                </motion.div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <CardTitle>Recent Expenses</CardTitle>
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
              <CardContent>
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
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{expense.description}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[expense.category]}`}>
                          {categoryLabels[expense.category]}
                        </span>
                        {expense.subcategory && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            {expense.subcategory}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(expense.date)} at {formatTime(expense.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold">{formatAmount(expense.amount)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
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
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}