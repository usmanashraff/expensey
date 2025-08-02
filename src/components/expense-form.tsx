'use client'

import { useState } from 'react'
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
}

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          category,
          date: date?.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add expense')
      }

      setAmount('')
      setDescription('')
      setCategory('')
      setDate(new Date())
      toast.success('Expense added successfully!')
      onExpenseAdded()
    } catch (error) {
      toast.error('Failed to add expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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