'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/currency'

interface SavingsData {
  month: number
  year: number
  monthName: string
  amount: number
  monthlyContribution: number
  totalSaved: number
  cumulative: number
}

export function SavingsChart() {
  const [savingsHistory, setSavingsHistory] = useState<SavingsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSavingsHistory()
  }, [])

  const fetchSavingsHistory = async () => {
    try {
      const response = await fetch('/api/savings/history')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setSavingsHistory(data)
    } catch (error) {
      console.error('Failed to fetch savings history:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    cumulative: {
      label: 'Total Savings',
      color: 'hsl(var(--chart-1))',
    },
    monthlyContribution: {
      label: 'Monthly Contribution',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">Loading savings history...</div>
    )
  }

  if (savingsHistory.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No savings history yet. Start saving to see your progress!
      </div>
    )
  }

  const totalSaved = savingsHistory[savingsHistory.length - 1]?.cumulative || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Savings Over Time</CardTitle>
        <CardDescription>
          Your savings journey - Total saved: {formatCurrency(totalSaved, 'PKR')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={savingsHistory}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="monthName"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'cumulative') {
                        return [`${formatCurrency(value as number, 'PKR')}`, 'Total Saved']
                      }
                      if (name === 'monthlyContribution') {
                        return [`${formatCurrency(value as number, 'PKR')}`, 'Monthly Contribution']
                      }
                      return [`${formatCurrency(value as number, 'PKR')}`, name]
                    }}
                    labelFormatter={(value) => {
                      const data = savingsHistory.find(d => d.monthName === value)
                      if (data) {
                        return `${data.monthName} ${data.year}`
                      }
                      return value
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="monthlyContribution"
                stackId="1"
                stroke="#c084fc"
                strokeWidth={2}
                fill="url(#colorMonthly)"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#a78bfa"
                strokeWidth={3}
                fill="url(#colorSavings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span>Total Savings (Cumulative)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-400" />
            <span>Monthly Contributions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}