'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, MicOff, Send, Loader2, Sparkles, Check, X, Edit2, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ParsedExpense {
  amount: number
  description: string
  category: 'NEED' | 'WANT' | 'SELF_DEVELOPMENT' | 'SAVINGS'
  subcategory?: string | null
  date: string
  currency: string
}

interface NaturalLanguageInputProps {
  onExpenseAdded?: (expense: any) => void
  utilityTypes?: string[]
  compact?: boolean
}

const categoryColors = {
  NEED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  WANT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SELF_DEVELOPMENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SAVINGS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
}

const categoryLabels = {
  NEED: 'Needs',
  WANT: 'Wants',
  SELF_DEVELOPMENT: 'Self Development',
  SAVINGS: 'Savings'
}

export default function NaturalLanguageInput({ onExpenseAdded, utilityTypes = [], compact = false }: NaturalLanguageInputProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [availableUtilities, setAvailableUtilities] = useState<string[]>([])
  const [loadingUtilities, setLoadingUtilities] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Fetch utility types
  useEffect(() => {
    const fetchUtilityTypes = async () => {
      setLoadingUtilities(true)
      try {
        const response = await fetch('/api/utility-types')
        if (!response.ok) throw new Error('Failed to fetch utility types')
        const data = await response.json()
        setAvailableUtilities(data.map((u: any) => u.name))
      } catch (error) {
        console.error('Failed to fetch utility types:', error)
        // Use provided utility types as fallback
        setAvailableUtilities(utilityTypes)
      } finally {
        setLoadingUtilities(false)
      }
    }
    
    fetchUtilityTypes()
  }, [utilityTypes])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + ' ' + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in browser settings.')
        }
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
      toast.success('Listening... Speak your expense')
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return

    setIsProcessing(true)
    setParsedExpenses([])
    setInterpretation('')
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/ai/parse-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: input,
          utilities: utilityTypes 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to parse expense')
      }

      const data = await response.json()
      
      if (data.expenses && data.expenses.length > 0) {
        setParsedExpenses(data.expenses)
        setInterpretation(data.interpretation || '')
        setShowConfirmation(true)
        
        if (data.suggestions && data.suggestions.length > 0) {
          data.suggestions.forEach((suggestion: string) => {
            toast.info(suggestion)
          })
        }
      } else {
        toast.error('Could not understand the expense. Please try again with more details.')
      }
    } catch (error) {
      console.error('Error parsing expense:', error)
      toast.error('Failed to process your input. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmExpenses = async () => {
    setIsSaving(true)
    let successCount = 0
    let failedExpenses: string[] = []
    
    for (const expense of parsedExpenses) {
      try {
        // Ensure subcategory is null if empty or if category is SAVINGS
        const expenseData = {
          ...expense,
          subcategory: expense.category === 'SAVINGS' ? null : (expense.subcategory || null)
        }
        
        // Create optimistic expense with temporary ID
        const optimisticExpense = {
          ...expenseData,
          id: `temp-${Date.now()}-${Math.random()}`,
          userId: 'current-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          receipt: null,
          receipts: [],
          date: new Date(expenseData.date)
        }
        
        // Immediately show optimistic update
        onExpenseAdded?.(optimisticExpense)
        
        console.log('Sending expense to API:', expenseData)
        
        try {
          const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(expenseData)
          })

          const responseData = await response.json()
          
          if (!response.ok) {
            console.error('API Error:', responseData)
            // Remove optimistic update on error
            onExpenseAdded?.(undefined)
            throw new Error(responseData.error || 'Failed to add expense')
          }

          successCount++
          // Send the real expense data to replace the optimistic one
          onExpenseAdded?.(responseData)
        } catch (apiError) {
          // Remove optimistic update on any API error
          onExpenseAdded?.(undefined)
          throw apiError
        }
      } catch (error) {
        console.error('Error adding expense:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        failedExpenses.push(`${expense.description}: ${errorMessage}`)
      }
    }

    if (successCount > 0) {
      toast.success(`Added ${successCount} expense(s) successfully!`)
      setInput('')
      setParsedExpenses([])
      setShowConfirmation(false)
      setInterpretation('')
    }
    
    if (failedExpenses.length > 0) {
      failedExpenses.forEach(msg => toast.error(msg))
    }
    
    setIsSaving(false)
  }

  const cancelExpenses = () => {
    setParsedExpenses([])
    setShowConfirmation(false)
    setInterpretation('')
    toast.info('Cancelled. You can try again.')
  }

  const updateExpense = (index: number, field: keyof ParsedExpense, value: any) => {
    setParsedExpenses(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeExpense = (index: number) => {
    setParsedExpenses(prev => prev.filter((_, i) => i !== index))
    if (parsedExpenses.length === 1) {
      setShowConfirmation(false)
    }
  }

  return compact ? (
    <div className="space-y-4">
      {!showConfirmation ? (
        <>
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., 'Transport fare 200' or 'Coffee 350 and lunch 800'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              className="min-h-[60px] bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm resize-none"
              disabled={isProcessing}
            />
            
            <div className="flex gap-2">
              {/* <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                disabled={isProcessing}
                className="shrink-0"
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button> */}
              
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {interpretation && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>AI:</strong> {interpretation}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {parsedExpenses.map((expense, index) => (
                <div
                  key={index}
                  className="p-2 bg-white/60 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={expense.description}
                        onChange={(e) => updateExpense(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border dark:bg-gray-800 dark:border-gray-600"
                        placeholder="Description"
                      />
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={expense.amount}
                          onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 text-xs rounded border dark:bg-gray-800 dark:border-gray-600"
                          placeholder="Amount"
                        />
                        <Select
                          value={expense.category}
                          onValueChange={(value) => updateExpense(index, 'category', value)}
                        >
                          <SelectTrigger className="flex-1 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEED">Need</SelectItem>
                            <SelectItem value="WANT">Want</SelectItem>
                            <SelectItem value="SELF_DEVELOPMENT">Self Dev</SelectItem>
                            <SelectItem value="SAVINGS">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                        {expense.category !== 'SAVINGS' && (
                          <Select
                            value={expense.subcategory || ''}
                            onValueChange={(value) => updateExpense(index, 'subcategory', value)}
                          >
                            <SelectTrigger className="flex-1 h-7 text-xs">
                              <SelectValue placeholder="Utility" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUtilities.map((utility) => (
                                <SelectItem key={utility} value={utility}>
                                  {utility}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => setEditingIndex(null)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-red-600"
                          onClick={() => removeExpense(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-bold">
                            {expense.currency} {expense.amount.toLocaleString()}
                          </span>
                          <Badge className={`${categoryColors[expense.category]} scale-90`}>
                            {categoryLabels[expense.category]}
                          </Badge>
                          {expense.subcategory && (
                            <Badge variant="outline" className="scale-90">{expense.subcategory}</Badge>
                          )}
                          {!expense.subcategory && expense.category !== 'SAVINGS' && (
                            <Badge variant="outline" className="scale-90 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              No utility
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-red-600"
                          onClick={() => removeExpense(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={cancelExpenses}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmExpenses}
                size="sm"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Add {parsedExpenses.length}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  ) : (
    <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-base sm:text-xl">Smart Expense Entry</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Just describe your expense in plain English
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {!showConfirmation ? (
          <>
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., 'Spent 500 on groceries today' or 'Coffee at Starbucks 350 and lunch 800'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                className="min-h-[80px] bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm resize-none"
                disabled={isProcessing}
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  disabled={isProcessing}
                  className="shrink-0"
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isProcessing}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Process Expense
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Lunch at McDonald's 450",
                  "Paid rent 25000",
                  "Gym membership 3000",
                  "Sent home 30000"
                ].map((example, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(example)}
                    className="text-xs h-7 px-2"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {interpretation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>AI Understanding:</strong> {interpretation}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Confirm Expenses:</h4>
                
                {parsedExpenses.map((expense, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {editingIndex === index ? (
                          <>
                            <input
                              type="text"
                              value={expense.description}
                              onChange={(e) => updateExpense(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded border dark:bg-gray-800 dark:border-gray-600"
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value))}
                                className="w-24 px-2 py-1 text-sm rounded border dark:bg-gray-800 dark:border-gray-600"
                                placeholder="Amount"
                              />
                              <Select
                                value={expense.category}
                                onValueChange={(value) => updateExpense(index, 'category', value)}
                              >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NEED">Needs</SelectItem>
                                  <SelectItem value="WANT">Wants</SelectItem>
                                  <SelectItem value="SELF_DEVELOPMENT">Self Development</SelectItem>
                                  <SelectItem value="SAVINGS">Savings</SelectItem>
                                </SelectContent>
                              </Select>
                              {expense.category !== 'SAVINGS' && (
                                <Select
                                  value={expense.subcategory || ''}
                                  onValueChange={(value) => updateExpense(index, 'subcategory', value)}
                                >
                                  <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="Select utility" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableUtilities.map((utility) => (
                                      <SelectItem key={utility} value={utility}>
                                        {utility}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{expense.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-bold">
                                {expense.currency} {expense.amount.toLocaleString()}
                              </span>
                              <Badge className={categoryColors[expense.category]}>
                                {categoryLabels[expense.category]}
                              </Badge>
                              {expense.subcategory && (
                                <Badge variant="outline">{expense.subcategory}</Badge>
                              )}
                              {!expense.subcategory && expense.category !== 'SAVINGS' && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                                  No utility selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                        >
                          {editingIndex === index ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Edit2 className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600"
                          onClick={() => removeExpense(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={cancelExpenses}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmExpenses}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Add {parsedExpenses.length} Expense{parsedExpenses.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  )
}