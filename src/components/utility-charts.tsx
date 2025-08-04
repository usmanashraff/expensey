'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Expense } from '@/generated/prisma'
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/currency'

interface UtilityChartsProps {
  expenses: Expense[]
}

export function UtilityCharts({ expenses }: UtilityChartsProps) {
  // Calculate expenses by utility type
  const expensesByUtility = expenses.reduce((acc, expense) => {
    if (expense.subcategory) {
      acc[expense.subcategory] = (acc[expense.subcategory] || 0) + expense.amount
    }
    return acc
  }, {} as Record<string, number>)

  // Calculate total expenses with utilities
  const totalUtilityExpenses = Object.values(expensesByUtility).reduce((sum, amount) => sum + amount, 0)

  // Prepare data for charts
  const utilityData = Object.entries(expensesByUtility)
    .map(([utility, amount]) => ({
      utility,
      amount,
      percentage: totalUtilityExpenses > 0 ? ((amount / totalUtilityExpenses) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.amount - a.amount)

  const chartConfig = {
    amount: {
      label: 'Amount',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig

  // Define colors for each utility type
  const utilityColors: Record<string, string> = {
    Transport: 'rgb(59 130 246)', // blue-500
    'Outside Food': 'rgb(249 115 22)', // orange-500
    Medical: 'rgb(236 72 153)', // pink-500
    Fruits: 'rgb(34 197 94)', // green-500
    Lifestyle: 'rgb(168 85 247)', // purple-500
    'Sent Home': 'rgb(245 158 11)', // amber-500
    Bills: 'rgb(239 68 68)', // red-500
    Misc: 'rgb(107 114 128)', // gray-500
  }

  if (totalUtilityExpenses === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No utility expenses to display. Add expenses with utility types to see the breakdown.
      </div>
    )
  }

  // Prepare data for radar chart
  const radarData = utilityData.map(item => ({
    utility: item.utility,
    amount: item.amount,
    fullMark: Math.max(...utilityData.map(d => d.amount)),
  }))

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Interactive Area Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Utility Analytics</CardTitle>
          <CardDescription>Interactive spending overview by utility type</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={utilityData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 100,
                }}
              >
                <defs>
                  <linearGradient id="colorUtility" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="utility"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  className="text-[10px] sm:text-xs"
                />
                <YAxis
                  className="text-[10px] sm:text-xs"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        const data = utilityData.find(d => d.amount === value)
                        if (data) {
                          return [`${formatCurrency(value as number, 'PKR')} (${data.percentage}%)`, 'Amount']
                        }
                        return [`${formatCurrency(value as number, 'PKR')}`, name]
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorUtility)"
                  activeDot={{ r: 8, fill: '#3b82f6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Utility Distribution</CardTitle>
          <CardDescription>Relative spending across utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid radialLines={false} />
                <PolarAngleAxis
                  dataKey="utility"
                  tick={{ fontSize: 9 }}
                  className="text-[9px] sm:text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar
                  name="Amount"
                  dataKey="amount"
                  stroke="rgb(96 165 250)"
                  fill="rgb(96 165 250)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Utility Breakdown</CardTitle>
          <CardDescription>Detailed spending by utility type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {utilityData.map((item) => (
              <div
                key={item.utility}
                className="flex flex-col items-center p-2 sm:p-4 rounded-lg border bg-card"
              >
                <div
                  className="h-3 w-3 rounded-full mb-2"
                  style={{ backgroundColor: utilityColors[item.utility] || 'rgb(107 114 128)' }}
                />
                <h4 className="font-medium text-xs sm:text-sm text-center">{item.utility}</h4>
                <p className="text-sm sm:text-lg font-semibold mt-1">{formatCurrency(item.amount, 'PKR')}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}