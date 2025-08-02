'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ExpenseCategory } from '@/generated/prisma'
import { toast } from 'sonner'

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
  const [utilityType, setUtilityType] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([])
  const [loadingUtilities, setLoadingUtilities] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category || !utilityType) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        subcategory: utilityType,
        date: date?.toISOString(),
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

  const categoryLabels = {
    NEED: 'Need',
    WANT: 'Want',
    SELF_DEVELOPMENT: 'Self Development',
    SAVINGS: 'Savings',
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
        <CardDescription>Track your daily expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utilityType">Utility Type</Label>
            <Select value={utilityType} onValueChange={setUtilityType} required disabled={loadingUtilities}>
              <SelectTrigger id="utilityType">
                <SelectValue placeholder={loadingUtilities ? "Loading..." : "Select utility type"} />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}