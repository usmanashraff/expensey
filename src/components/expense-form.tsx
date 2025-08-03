'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, PlusCircle, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ExpenseCategory } from '@/generated/prisma'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useUserSettings } from '@/hooks/use-user-settings'

interface ExpenseFormProps {
  onExpenseAdded: () => void
  utilityRefreshTrigger?: number
}

interface UtilityType {
  id: string
  name: string
}

export function ExpenseForm({ onExpenseAdded, utilityRefreshTrigger }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [currency, setCurrency] = useState('PKR')
  const [utilityType, setUtilityType] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([])
  const [loadingUtilities, setLoadingUtilities] = useState(true)
  const { settings } = useUserSettings()

  useEffect(() => {
    setCurrency(settings.defaultCurrency)
  }, [settings.defaultCurrency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category) {
      toast.error('Please fill in all required fields')
      return
    }

    // Utility type is required for all categories except SAVINGS
    if (category !== 'SAVINGS' && !utilityType) {
      toast.error('Please select a utility type')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        subcategory: category === 'SAVINGS' ? null : utilityType || null,
        date: date?.toISOString(),
        currency: currency,
      }
      
      console.log('Sending expense data:', payload)
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to add expense:', errorData)
        throw new Error(errorData.error || 'Failed to add expense')
      }

      setAmount('')
      setDescription('')
      setCategory('')
      setUtilityType('')
      setDate(new Date())
      toast.success('Expense added successfully!')
      onExpenseAdded()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchUtilityTypes = async () => {
    try {
      const response = await fetch('/api/utility-types')
      if (!response.ok) throw new Error('Failed to fetch utility types')
      const data = await response.json()
      setUtilityTypes(data)
    } catch (error) {
      console.error('Failed to fetch utility types:', error)
      toast.error('Failed to load utility types')
    } finally {
      setLoadingUtilities(false)
    }
  }

  useEffect(() => {
    fetchUtilityTypes()
    // Reset utility type selection if the refresh trigger changes
    if (utilityRefreshTrigger && utilityRefreshTrigger > 0) {
      setUtilityType('')
    }
  }, [utilityRefreshTrigger])

  const categoryConfig = {
    NEED: { label: 'Need', color: 'from-yellow-500 to-orange-500' },
    WANT: { label: 'Want', color: 'from-red-500 to-pink-500' },
    SELF_DEVELOPMENT: { label: 'Self Development', color: 'from-green-500 to-emerald-500' },
    SAVINGS: { label: 'Savings', color: 'from-blue-500 to-cyan-500' },
  }

  return (
    <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
      
      <CardHeader className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg"
        >
          <Wallet className="h-6 w-6 text-white" />
        </motion.div>
        <CardTitle className="text-2xl font-bold">Add New Expense</CardTitle>
        <CardDescription>Track your daily expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="backdrop-blur-sm bg-white/50 dark:bg-white/5"
            />
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="backdrop-blur-sm bg-white/50 dark:bg-white/5"
            />
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => {
              setCategory(value as ExpenseCategory)
              // Clear utility type when switching to SAVINGS
              if (value === 'SAVINGS') {
                setUtilityType('')
              }
            }}>
              <SelectTrigger id="category" className="backdrop-blur-sm bg-white/50 dark:bg-white/5">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Label htmlFor="utilityType">
              Utility Type {category !== 'SAVINGS' && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={utilityType} 
              onValueChange={setUtilityType} 
              required={category !== 'SAVINGS'}
              disabled={loadingUtilities || category === 'SAVINGS'}
            >
              <SelectTrigger id="utilityType" className="backdrop-blur-sm bg-white/50 dark:bg-white/5">
                <SelectValue placeholder={
                  loadingUtilities ? "Loading..." : 
                  category === 'SAVINGS' ? "Not applicable for savings" : 
                  "Select utility type"
                } />
              </SelectTrigger>
              <SelectContent>
                {utilityTypes.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No utility types available
                  </SelectItem>
                ) : (
                  utilityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal backdrop-blur-sm bg-white/50 dark:bg-white/5"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Leave empty to use today's date
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg" 
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </motion.div>
        </form>
      </CardContent>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-2xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </Card>
  )
}