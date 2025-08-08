'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/currency'
import { motion } from 'framer-motion'

interface IncomeChartsProps {
  year?: number
  optimisticIncome?: any
}

export function IncomeCharts({ year, optimisticIncome }: IncomeChartsProps) {
  const [incomeStats, setIncomeStats] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear())
  const [previousOptimisticIncome, setPreviousOptimisticIncome] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  // Handle optimistic updates
  useEffect(() => {
    if (optimisticIncome && optimisticIncome !== previousOptimisticIncome) {
      setPreviousOptimisticIncome(optimisticIncome)
      
      // Apply optimistic update to the data
      if (incomeStats && comparisonData) {
        const incomeDate = new Date(optimisticIncome.date)
        const incomeMonth = incomeDate.getMonth()
        const incomeYear = incomeDate.getFullYear()
        
        if (incomeYear === selectedYear) {
          // Update income stats
          const updatedStats = { ...incomeStats }
          const monthData = updatedStats.monthlyIncome[incomeMonth] || { month: incomeMonth, income: 0, growthRate: null }
          monthData.income += optimisticIncome.amount
          updatedStats.totalIncome += optimisticIncome.amount
          updatedStats.averageMonthlyIncome = updatedStats.totalIncome / (updatedStats.monthsWithIncome || 1)
          setIncomeStats(updatedStats)
          
          // Update comparison data
          const updatedComparison = { ...comparisonData }
          const monthComparison = updatedComparison.monthlyComparison[incomeMonth]
          if (monthComparison) {
            monthComparison.income += optimisticIncome.amount
            monthComparison.savings = monthComparison.income - monthComparison.expenses
            monthComparison.spendingPercentage = monthComparison.income > 0 
              ? (monthComparison.expenses / monthComparison.income) * 100 
              : 0
          }
          updatedComparison.totals.income += optimisticIncome.amount
          updatedComparison.totals.savings = updatedComparison.totals.income - updatedComparison.totals.expenses
          updatedComparison.totals.spendingPercentage = updatedComparison.totals.income > 0
            ? (updatedComparison.totals.expenses / updatedComparison.totals.income) * 100
            : 0
          setComparisonData(updatedComparison)
        }
      }
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchData()
      }, 1000)
    }
  }, [optimisticIncome, selectedYear, incomeStats, comparisonData])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch income statistics
      const statsResponse = await fetch(`/api/income/stats?year=${selectedYear}`)
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setIncomeStats(stats)
      }

      // Fetch income vs expenses comparison
      const comparisonResponse = await fetch(`/api/income/comparison?year=${selectedYear}`)
      if (comparisonResponse.ok) {
        const comparison = await comparisonResponse.json()
        console.log('Frontend - Comparison Data:', comparison)
        setComparisonData(comparison)
      }
    } catch (error) {
      console.error('Error fetching income data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="h-96 flex items-center justify-center">
            <div className="text-muted-foreground">Loading income data...</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="h-96 flex items-center justify-center">
            <div className="text-muted-foreground">Loading comparison data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Prepare data for income growth chart
  const incomeGrowthData = incomeStats?.monthlyIncome?.map((item: any) => ({
    month: monthNames[item.month],
    income: item.income,
    growthRate: item.growthRate || 0,
  })) || []

  // Prepare data for spending percentage chart
  const spendingPercentageData = comparisonData?.monthlyComparison?.map((item: any) => ({
    month: item.monthName,
    income: item.income,
    expenses: item.expenses,
    spendingPercentage: item.spendingPercentage,
    savings: item.savings,
  })) || []

  const chartConfig = {
    income: {
      label: "Income",
      color: "#10b981",
    },
    expenses: {
      label: "Expenses",
      color: "#ef4444",
    },
    growthRate: {
      label: "Growth Rate",
      color: "#8b5cf6",
    },
    spendingPercentage: {
      label: "Spending %",
      color: "#f59e0b",
    },
    savings: {
      label: "Savings",
      color: "#3b82f6",
    },
  } satisfies ChartConfig

  // Calculate average growth rate
  const avgGrowthRate = incomeStats?.monthlyIncome
    ?.filter((item: any) => item.growthRate !== null)
    ?.reduce((sum: number, item: any) => sum + item.growthRate, 0) / 
    (incomeStats?.monthlyIncome?.filter((item: any) => item.growthRate !== null)?.length || 1) || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Income Analytics</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-md"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - 2 + i
            return (
              <option key={year} value={year}>
                {year}
              </option>
            )
          })}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(incomeStats?.totalIncome || 0, 'PKR')}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(incomeStats?.averageMonthlyIncome || 0, 'PKR')}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Growth Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${avgGrowthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {avgGrowthRate.toFixed(1)}%
                </div>
                {avgGrowthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Spending %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${comparisonData?.totals?.spendingPercentage > 80 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {comparisonData?.totals?.spendingPercentage?.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Income Growth Rate Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Income Growth Rate by Month
            </CardTitle>
            <CardDescription>
              Monthly income amounts and growth percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeGrowthData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                    name="Income"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="growthRate"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="Growth %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Spending vs Income Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending Relative to Income
            </CardTitle>
            <CardDescription>
              Monthly expenses as percentage of income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingPercentageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" domain={[0, 100]} />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar yAxisId="left" dataKey="income" fill="#10b981" opacity={0.8} name="Income" />
                  <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" opacity={0.8} name="Expenses" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="spendingPercentage"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                    name="Spending %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Total Savings</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(comparisonData?.totals?.savings || 0, 'PKR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Total Income</p>
                <p className="font-semibold">
                  {formatCurrency(comparisonData?.totals?.income || 0, 'PKR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Total Expenses</p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(comparisonData?.totals?.expenses || 0, 'PKR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}