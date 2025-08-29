'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Loader2, Sparkles, TrendingUp, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface AIInsightsProps {
  month: number
  year: number
}

export default function AIInsights({ month, year }: AIInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [showInsights, setShowInsights] = useState(false)

  const analyzeSpending = async () => {
    setLoading(true)
    setShowInsights(true)
    
    try {
      const response = await fetch('/api/ai/analyze-spending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year, timeframe: 'month' })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze spending')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setStatistics(data.statistics)
    } catch (error) {
      console.error('Error analyzing spending:', error)
      toast.error('Failed to analyze spending patterns. Please try again.')
      setShowInsights(false)
    } finally {
      setLoading(false)
    }
  }

  const formatAnalysis = (text: string) => {
    // Split by sections and format
    const sections = text.split(/\d+\.\s\*\*/).filter(Boolean)
    
    return sections.map((section, index) => {
      const [title, ...content] = section.split('**:')
      const cleanTitle = title?.replace(/\*\*/g, '').trim()
      const cleanContent = content.join(':').trim()
      
      return { title: cleanTitle, content: cleanContent }
    })
  }

  const parseAnalysisContent = (text: string) => {
    if (!text) return null

    // Parse the markdown formatted AI response
    const sections: any = {}
    
    // Extract sections using markdown headers
    const healthScoreMatch = text.match(/##\s*1\.\s*Financial Health Score[\s\S]*?(?=##|$)/i)
    if (healthScoreMatch) sections.healthScore = healthScoreMatch[0].replace(/##\s*1\.\s*Financial Health Score/i, '').trim()
    
    const patternsMatch = text.match(/##\s*2\.\s*Spending Patterns[\s\S]*?(?=##|$)/i)
    if (patternsMatch) sections.patterns = patternsMatch[0].replace(/##\s*2\.\s*Spending Patterns/i, '').trim()
    
    const concernsMatch = text.match(/##\s*3\.\s*Top Concerns[\s\S]*?(?=##|$)/i)
    if (concernsMatch) sections.concerns = concernsMatch[0].replace(/##\s*3\.\s*Top Concerns/i, '').trim()
    
    const recsMatch = text.match(/##\s*4\.\s*Smart Recommendations[\s\S]*?(?=##|$)/i)
    if (recsMatch) sections.recommendations = recsMatch[0].replace(/##\s*4\.\s*Smart Recommendations/i, '').trim()
    
    const positiveMatch = text.match(/##\s*5\.\s*Positive Points[\s\S]*?(?=##|$)/i)
    if (positiveMatch) sections.positives = positiveMatch[0].replace(/##\s*5\.\s*Positive Points/i, '').trim()
    
    const forecastMatch = text.match(/##\s*6\.\s*Next Month Forecast[\s\S]*?(?=##|$)/i)
    if (forecastMatch) sections.forecast = forecastMatch[0].replace(/##\s*6\.\s*Next Month Forecast/i, '').trim()
    
    return sections
  }

  const parsedAnalysis = analysis ? parseAnalysisContent(analysis) : null

  return (
    <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
            >
              <Brain className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base sm:text-xl">AI Spending Insights</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Powered by advanced pattern analysis
              </CardDescription>
            </div>
          </div>
          
          <Button
            onClick={analyzeSpending}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Spending
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="relative z-10 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing your spending patterns...</p>
                </div>
              ) : parsedAnalysis ? (
                <div className="space-y-6">
                  {/* Health Score */}
                  {parsedAnalysis.healthScore && (
                    <div className="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold">Financial Health Score</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {parsedAnalysis.healthScore.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spending Patterns */}
                  {parsedAnalysis.patterns && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold">Spending Patterns</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {parsedAnalysis.patterns.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Concerns */}
                  {parsedAnalysis.concerns && (
                    <div className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h3 className="font-semibold">Areas of Concern</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {parsedAnalysis.concerns.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 text-red-700 dark:text-red-300' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {parsedAnalysis.recommendations && (
                    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">Smart Recommendations</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {parsedAnalysis.recommendations.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 font-medium' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Positive Observations */}
                  {parsedAnalysis.positives && (
                    <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold">You're Doing Great!</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {parsedAnalysis.positives.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 text-green-700 dark:text-green-300' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forecast */}
                  {parsedAnalysis.forecast && (
                    <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold">Next Month Forecast</h3>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {parsedAnalysis.forecast.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-muted-foreground">Net Balance</p>
                        <p className="text-lg font-bold text-primary">
                          PKR {statistics.netBalance.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-muted-foreground">Savings Rate</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {statistics.savingsRate}%
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-muted-foreground">Daily Avg</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          PKR {statistics.avgDailySpending}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          PKR {statistics.totalExpenses.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}