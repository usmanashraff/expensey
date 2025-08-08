'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, Edit, Trash2, Plus, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { IncomeForm } from './income-form'
import { formatCurrency } from '@/lib/currency'

interface Income {
  id: string
  source: string
  amount: number
  date: string
  currency: string
  description?: string
  isRecurring: boolean
}

interface IncomeListProps {
  optimisticIncome?: Income | null
  onOptimisticIncomeConfirmed?: () => void
  onIncomeAdded?: (income: Income) => void
  selectedMonth?: number
  selectedYear?: number
}

export function IncomeList({ 
  optimisticIncome, 
  onOptimisticIncomeConfirmed, 
  onIncomeAdded,
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear()
}: IncomeListProps = {}) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)
  const [optimisticUpdateActive, setOptimisticUpdateActive] = useState(false)
  const [previousOptimisticIncome, setPreviousOptimisticIncome] = useState<Income | null>(null)

  const fetchIncomes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setIncomes(data)
        
        // Calculate total
        const total = data.reduce((sum: number, income: Income) => sum + income.amount, 0)
        setTotalIncome(total)
      }
    } catch (error) {
      console.error('Error fetching incomes:', error)
      toast.error('Failed to fetch incomes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncomes()
  }, [selectedMonth, selectedYear])

  // Handle optimistic updates
  useEffect(() => {
    if (optimisticIncome && optimisticIncome !== previousOptimisticIncome) {
      setOptimisticUpdateActive(true)
      setPreviousOptimisticIncome(optimisticIncome)
      
      // Check if income belongs to current month/year
      const incomeDate = new Date(optimisticIncome.date)
      if (incomeDate.getMonth() + 1 === selectedMonth && incomeDate.getFullYear() === selectedYear) {
        // Add optimistic income to the list
        setIncomes(prev => [optimisticIncome, ...prev])
        setTotalIncome(prev => prev + optimisticIncome.amount)
      }
      
      // Fetch actual data after a delay
      setTimeout(() => {
        fetchIncomes().then(() => {
          setOptimisticUpdateActive(false)
          if (onOptimisticIncomeConfirmed) {
            onOptimisticIncomeConfirmed()
          }
        })
      }, 500)
    }
  }, [optimisticIncome, selectedMonth, selectedYear])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income?')) return

    try {
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Income deleted successfully')
        fetchIncomes()
      } else {
        throw new Error('Failed to delete income')
      }
    } catch (error) {
      console.error('Error deleting income:', error)
      toast.error('Failed to delete income')
    }
  }

  const handleIncomeAdded = (newIncome?: any) => {
    if (newIncome && onIncomeAdded) {
      // Pass the new income up to parent for optimistic update
      onIncomeAdded(newIncome)
    }
    setIsAddDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Income Sources
            </CardTitle>
            <CardDescription>
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
              </DialogHeader>
              <IncomeForm 
                onIncomeAdded={handleIncomeAdded}
                isInDialog={true}
                onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome, incomes[0]?.currency || 'PKR')}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading incomes...
          </div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No income recorded for this period
          </div>
        ) : (
          <div className="space-y-2">
            {incomes.map((income, index) => {
              const isOptimistic = optimisticUpdateActive && index === 0 && income.id === optimisticIncome?.id
              return (
              <motion.div
                key={income.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isOptimistic ? 0.7 : 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  isOptimistic ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{income.source}</h4>
                    {income.isRecurring && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Recurring
                      </span>
                    )}
                  </div>
                  {income.description && (
                    <p className="text-sm text-muted-foreground">{income.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(income.date), 'PPP')}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(income.amount, income.currency)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(income.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}