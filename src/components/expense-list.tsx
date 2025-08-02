'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Expense } from '@/generated/prisma'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ExpenseCharts } from './expense-charts'
import { SavingsChart } from './savings-chart'
import { ChevronDown, ChevronUp, BarChart3, ChevronLeft, ChevronRight, Calendar, Receipt } from 'lucide-react'

interface ExpenseListProps {
  refreshTrigger: number
}

export function ExpenseList({ refreshTrigger }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlySavings, setMonthlySavings] = useState<number>(0)
  const [totalSavings, setTotalSavings] = useState<number>(0)
  const [showCharts, setShowCharts] = useState(false)
  const [showExpenses, setShowExpenses] = useState(true)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

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
  

  useEffect(() => {
    fetchExpenses()
    fetchSavings()
  }, [refreshTrigger, selectedMonth, selectedYear])

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

  const totalExpenses = expenses
    .filter(expense => expense.category !== 'SAVINGS')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear
  const canGoNext = !(selectedMonth === currentMonth && selectedYear === currentYear)

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
            <CardTitle>Monthly Summary</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[180px] justify-center">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{monthName}</span>
              </div>
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
                <p className="text-2xl font-bold">PKR {totalExpenses.toFixed(0)}</p>
              </div>
              {Object.entries(categoryLabels).filter(([key]) => key !== 'SAVINGS').map(([key, label]) => (
                <div key={key} className="text-center">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold">
                    PKR {(expensesByCategory[key] || 0).toFixed(0)}
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
                  <p className="text-xl font-semibold text-purple-600">PKR {monthlySavings.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Lifetime Total</p>
                  <p className="text-xl font-semibold text-green-600">PKR {totalSavings.toFixed(0)}</p>
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
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(expense.date)} at {formatTime(expense.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold">PKR {expense.amount.toFixed(0)}</p>
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