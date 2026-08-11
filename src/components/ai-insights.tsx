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
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/50 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#496177]/10 flex items-center justify-center text-tertiary dark:text-on-surface border border-[#496177]/20">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h3 className="font-serif-heading text-2xl font-medium text-on-surface">AI Spending Insights</h3>
            <p className="font-sans text-base text-on-surface-variant">Powered by advanced pattern analysis</p>
          </div>
        </div>
        <button
          onClick={analyzeSpending}
          disabled={loading}
          className="bg-[#212529] hover:bg-black text-white dark:bg-[#f6fafe] dark:hover:bg-white dark:text-[#14171a] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-2 self-start md:self-auto transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-sm">analytics</span>
          )}
          {loading ? 'Analyzing...' : 'Analyze Spending'}
        </button>
      </div>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#496177] mb-4" />
                <p className="text-sm text-on-surface-variant">Analyzing your spending patterns...</p>
              </div>
            ) : parsedAnalysis ? (
              <>
                {/* Bento Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Core Insights */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Financial Health Score */}
                    {parsedAnalysis.healthScore && (
                      <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-lg p-6 flex items-start gap-4 hover:border-[#496177]/50 transition-colors">
                        <span className="material-symbols-outlined text-tertiary dark:text-on-surface mt-1">trending_up</span>
                        <div>
                          <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface mb-2">Financial Health Score</h4>
                          <div className="text-sm text-on-surface-variant space-y-1">
                            {parsedAnalysis.healthScore.split('\n').map((line: string, i: number) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Spending Patterns */}
                    {parsedAnalysis.patterns && (
                      <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-lg p-6 hover:border-[#496177]/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-on-surface-variant">donut_small</span>
                          <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface">Spending Patterns</h4>
                        </div>
                        <ul className="space-y-3 font-sans text-base text-[#444749] dark:text-[#f6fafe]">
                          {parsedAnalysis.patterns.split('\n').filter(Boolean).map((line: string, i: number) => (
                            <li key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0">
                              <span className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Month Forecast */}
                    {parsedAnalysis.forecast && (
                      <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-lg p-6 hover:border-[#496177]/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
                          <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface">Next Month Forecast</h4>
                        </div>
                        <ul className="space-y-3 font-sans text-base text-[#444749] dark:text-[#f6fafe]">
                          {parsedAnalysis.forecast.split('\n').filter(Boolean).map((line: string, i: number) => (
                            <li key={i} className="flex justify-between items-center">
                              <span className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 text-on-surface-variant' : ''}>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Alerts & Recommendations */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Areas of Concern */}
                    {parsedAnalysis.concerns && (
                      <div className="bg-[#ffffff] dark:bg-[#14171a] border border-[#ba1a1a]/30 rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#ba1a1a]"></div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
                          <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface">Areas of Concern</h4>
                        </div>
                        <ul className="space-y-3 font-sans text-base text-[#444749] dark:text-[#f6fafe]">
                          {parsedAnalysis.concerns.split('\n').filter(Boolean).map((line: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[#ba1a1a] text-sm mt-1">remove</span>
                              <span>{line.replace(/^[•-]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Smart Recommendations */}
                    {parsedAnalysis.recommendations && (
                      <div className="bg-[#f0f4f8] dark:bg-[#24282c] border border-outline-variant rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-tertiary dark:text-on-surface">lightbulb</span>
                          <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface">Smart Recommendations</h4>
                        </div>
                        <ul className="space-y-3 font-sans text-base text-[#444749] dark:text-[#f6fafe]">
                          {parsedAnalysis.recommendations.split('\n').filter(Boolean).map((line: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#496177] dark:bg-[#f6fafe] shrink-0"></span>
                              <span>{line.replace(/^[•-]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Positive Reinforcement */}
                    {parsedAnalysis.positives && (
                      <div className="bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-lg p-6 flex flex-col items-center text-center justify-center flex-grow">
                        <span className="material-symbols-outlined text-3xl mb-3 text-[#181c20] dark:text-[#f6fafe]">verified</span>
                        <h4 className="font-sans text-sm font-semibold tracking-wide text-on-surface mb-2">You're Doing Great!</h4>
                        <div className="font-sans text-base text-on-surface-variant space-y-1">
                          {parsedAnalysis.positives.split('\n').filter(Boolean).map((line: string, i: number) => (
                            <div key={i}>{line.replace(/^[•-]\s*/, '')}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Summary Stats */}
                {statistics && (
                  <div className="mt-10 pt-8 border-t border-outline-variant/50 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Net Balance</div>
                      <div className="font-serif-heading text-2xl font-medium text-on-surface">
                        {statistics.netBalance.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">PKR</span>
                      </div>
                    </div>
                    <div className="border-l border-outline-variant/30">
                      <div className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Savings Rate</div>
                      <div className="font-serif-heading text-2xl font-medium text-tertiary dark:text-on-surface">{statistics.savingsRate}%</div>
                    </div>
                    <div className="border-l border-outline-variant/30 hidden lg:block">
                      <div className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Daily Avg</div>
                      <div className="font-serif-heading text-2xl font-medium text-on-surface">
                        {statistics.avgDailySpending} <span className="text-sm font-normal text-on-surface-variant">PKR</span>
                      </div>
                    </div>
                    <div className="border-l border-outline-variant/30 hidden lg:block">
                      <div className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Spent</div>
                      <div className="font-serif-heading text-2xl font-medium text-[#ba1a1a]">
                        {statistics.totalExpenses.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">PKR</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}