'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Expense } from '@/generated/prisma'
import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/currency'

interface ExpenseChartsProps {
  expenses: Expense[]
}

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  // Calculate total expenses (including savings for percentage calculation)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Prepare data for charts
  const chartData = [
    {
      category: 'Needs',
      value: expensesByCategory.NEED || 0,
      percentage: totalExpenses > 0 ? ((expensesByCategory.NEED || 0) / totalExpenses * 100).toFixed(1) : '0',
      fill: 'rgb(251 191 36)', // amber-400 - vibrant yellow
      fillOpacity: 0.8,
    },
    {
      category: 'Wants',
      value: expensesByCategory.WANT || 0,
      percentage: totalExpenses > 0 ? ((expensesByCategory.WANT || 0) / totalExpenses * 100).toFixed(1) : '0',
      fill: 'rgb(251 113 133)', // rose-400 - vibrant pink-red
      fillOpacity: 0.8,
    },
    {
      category: 'Self Development',
      value: expensesByCategory.SELF_DEVELOPMENT || 0,
      percentage: totalExpenses > 0 ? ((expensesByCategory.SELF_DEVELOPMENT || 0) / totalExpenses * 100).toFixed(1) : '0',
      fill: 'rgb(52 211 153)', // emerald-400 - vibrant green
      fillOpacity: 0.8,
    },
    {
      category: 'Savings',
      value: expensesByCategory.SAVINGS || 0,
      percentage: totalExpenses > 0 ? ((expensesByCategory.SAVINGS || 0) / totalExpenses * 100).toFixed(1) : '0',
      fill: 'rgb(167 139 250)', // violet-400 - vibrant purple
      fillOpacity: 0.8,
    },
  ].filter(item => item.value > 0) // Only show categories with expenses

  const chartConfig = {
    value: {
      label: 'Amount',
    },
    needs: {
      label: 'Needs',
      color: '#facc15',
    },
    wants: {
      label: 'Wants',
      color: '#ef4444',
    },
    selfDevelopment: {
      label: 'Self Development',
      color: '#22c55e',
    },
    savings: {
      label: 'Savings',
      color: '#a855f7',
    },
  } satisfies ChartConfig

  // Prepare data for radial chart
  const radialData = chartData.map(item => ({
    ...item,
    displayValue: parseFloat(item.percentage),
  }))

  if (totalExpenses === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No expenses to display. Add expenses to see the breakdown.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Expense Distribution</CardTitle>
          <CardDescription>Percentage breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={0}
                  label={({ percentage }) => `${percentage}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={entry.fillOpacity} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {chartData.map((item) => (
              <div key={item.category} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-xs sm:text-sm">
                  {item.category}: {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radial Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Category Analysis</CardTitle>
          <CardDescription>Amount spent in each category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="90%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <ChartTooltip content={<ChartTooltipContent />} />
                <RadialBar
                  dataKey="displayValue"
                  background
                  cornerRadius={10}
                  fill="#8884d8"
                  label={{
                    position: 'insideStart',
                    fill: '#fff',
                    formatter: (value: number) => `${value}%`,
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
            {chartData.map((item) => (
              <div key={item.category} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs sm:text-sm font-medium">{item.category}</span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {formatCurrency(item.value, 'PKR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}