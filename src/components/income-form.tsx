'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, DollarSign, Loader2, Calendar, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useUserSettings } from '@/hooks/use-user-settings'
import { Checkbox } from '@/components/ui/checkbox'

interface IncomeFormProps {
  onIncomeAdded: (newIncome?: any) => void
  isInDialog?: boolean
  onClose?: () => void
}

export function IncomeForm({ onIncomeAdded, isInDialog = false, onClose }: IncomeFormProps) {
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('PKR')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { settings } = useUserSettings()

  useEffect(() => {
    setCurrency(settings.defaultCurrency)
  }, [settings.defaultCurrency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !source || !date) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          source,
          description,
          date: new Date(date).toISOString(),
          currency,
          isRecurring,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add income')
      }

      const newIncome = await response.json()
      
      toast.success('Income added successfully!')
      
      // Reset form
      setAmount('')
      setSource('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setIsRecurring(false)
      
      onIncomeAdded(newIncome)
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error adding income:', error)
      toast.error('Failed to add income. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const CardWrapper = isInDialog ? 'div' : Card
  const HeaderWrapper = isInDialog ? 'div' : CardHeader
  const ContentWrapper = isInDialog ? 'div' : CardContent

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={isInDialog ? '' : 'relative'}
    >
      <CardWrapper className={isInDialog 
        ? 'backdrop-blur-xl bg-white/60 dark:bg-[oklch(0.2_0.02_250)]/60 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden' 
        : 'backdrop-blur-xl bg-white/60 dark:bg-[oklch(0.2_0.02_250)]/60 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden'
      }>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 pointer-events-none" />
        
        <HeaderWrapper className={`relative ${isInDialog ? 'px-6 pt-6 pb-4' : ''}`}>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
            >
              <DollarSign className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">Add Income</CardTitle>
              <CardDescription className="text-xs">Record your income source</CardDescription>
            </div>
          </div>
        </HeaderWrapper>
        
        <ContentWrapper className={`relative ${isInDialog ? 'px-6 pb-6' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium">
                  Income Source <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="source"
                  placeholder="e.g., Salary, Freelance"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20"
                    required
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24 backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label htmlFor="date" className="text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20"
                  required
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Additional details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20"
              />
            </motion.div>

            <motion.div 
              className="flex items-center space-x-2 p-3 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                className="border-white/40"
              />
              <Label
                htmlFor="recurring"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  This is a recurring income
                </span>
              </Label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Income...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Income
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </ContentWrapper>
      </CardWrapper>
    </motion.div>
  )
}