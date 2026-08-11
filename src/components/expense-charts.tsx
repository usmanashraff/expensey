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
    <div className="space-y-12">
      {/* Category Analytics Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/50 pb-4">
          <div className="w-10 h-10 rounded-full bg-[#f6f9ff] dark:bg-[#1c2024] flex items-center justify-center border border-[#b0c9e3]/50 dark:border-[#353a40]">
            <span className="material-symbols-outlined text-tertiary dark:text-on-surface">donut_large</span>
          </div>
          <div>
            <h2 className="font-serif-heading text-2xl font-medium text-on-surface">Category Analytics</h2>
            <p className="font-sans text-sm text-on-surface-variant">Visual representation of your financial data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Distribution (Pie Chart) */}
          <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-xl p-8 flex flex-col min-h-[400px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div>
              <h3 className="font-sans text-sm font-semibold tracking-wide text-on-surface mb-1">Expense Distribution</h3>
              <p className="font-sans text-xs text-on-surface-variant">Percentage breakdown by category</p>
            </div>
            <div className="flex-1 mt-6">
              <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      label={({ percentage }) => `${percentage}%`}
                      labelLine={false}
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={entry.fillOpacity} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {chartData.map((item) => (
                <div key={item.category} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
                  <span className="font-sans text-xs font-medium text-on-surface-variant">
                    {item.category}: {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Analysis (Radial Chart) */}
          <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-xl p-8 flex flex-col min-h-[400px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div>
              <h3 className="font-sans text-sm font-semibold tracking-wide text-on-surface mb-1">Category Analysis</h3>
              <p className="font-sans text-xs text-on-surface-variant">Amount spent in each category</p>
            </div>
            <div className="flex-1 mt-6">
              <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <RadialBar
                      dataKey="displayValue"
                      background
                      cornerRadius={10}
                      label={{
                        position: 'insideStart',
                        fill: '#fff',
                        formatter: (value: number) => `${value}%`,
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-3 mt-6">
              {chartData.map((item) => (
                <div key={item.category} className="flex justify-between items-center p-2 rounded-lg hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
                    <span className="font-sans text-sm font-medium text-on-surface-variant">{item.category}</span>
                  </div>
                  <span className="font-sans text-sm font-semibold text-on-surface">
                    {formatCurrency(item.value, 'PKR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown Grid */}
        <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="font-sans text-sm font-semibold tracking-wide text-on-surface mb-1">Category Breakdown</h3>
            <p className="font-sans text-xs text-on-surface-variant">Detailed spending by category</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData.map((item) => (
              <div key={item.category} className="border border-outline-variant/50 rounded-lg p-4 text-center hover:bg-surface-container transition-colors bg-[#f6fafe] dark:bg-[#1c2024]">
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: item.fill }}></div>
                <div className="font-sans text-xs font-semibold text-on-surface-variant mb-1">{item.category}</div>
                <div className="font-serif-heading text-lg sm:text-xl font-medium text-on-surface">{formatCurrency(item.value, 'PKR')}</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}