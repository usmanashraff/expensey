'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, PlusCircle, Wallet, Paperclip, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ExpenseCategory } from '@/generated/prisma'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useUserSettings } from '@/hooks/use-user-settings'

interface ExpenseFormProps {
  onExpenseAdded: (newExpense?: any) => void
  utilityRefreshTrigger?: number
  isInDialog?: boolean
  onClose?: () => void
}

interface UtilityType {
  id: string
  name: string
}

export function ExpenseForm({ onExpenseAdded, utilityRefreshTrigger, isInDialog = false, onClose }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [currency, setCurrency] = useState('PKR')
  const [utilityType, setUtilityType] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([])
  const [loadingUtilities, setLoadingUtilities] = useState(true)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const { settings } = useUserSettings()

  useEffect(() => {
    setCurrency(settings.defaultCurrency)
  }, [settings.defaultCurrency])

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP) or PDF file')
      return
    }

    // Validate file size (2MB limit to account for base64 encoding overhead)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Receipt file size must be less than 2MB')
      return
    }

    setReceipt(file)
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  const removeReceipt = () => {
    setReceipt(null)
    setReceiptPreview(null)
  }

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
      let receiptData = null
      
      // Convert receipt to base64 if present
      if (receipt) {
        const reader = new FileReader()
        receiptData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(receipt)
        })
      }

      // Set the time to noon to avoid timezone offset issues
      const expenseDate = date ? new Date(date) : new Date()
      expenseDate.setHours(12, 0, 0, 0)
      
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        subcategory: category === 'SAVINGS' ? null : utilityType || null,
        date: expenseDate.toISOString(),
        currency: currency,
        receipt: receiptData,
        receipts: receiptData ? [receiptData] : [],
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

      const newExpense = await response.json()

      setAmount('')
      setDescription('')
      setCategory('')
      setUtilityType('')
      setDate(new Date())
      setReceipt(null)
      setReceiptPreview(null)
      toast.success('Expense added successfully!')
      onExpenseAdded(newExpense)
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
    <Card className="relative backdrop-blur-xl bg-white/80 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg"
            >
              <Wallet className="h-6 w-6 text-white" />
            </motion.div>
            <CardTitle className={`${isInDialog ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'} font-bold`}>Add New Expense</CardTitle>
            <CardDescription className={isInDialog ? 'text-xs sm:text-sm' : ''}>Track your daily expenses by category</CardDescription>
          </div>
          {isInDialog && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive/10 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label htmlFor="amount" className={isInDialog ? 'text-xs sm:text-sm' : ''}>Amount ({currency})</Label>
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
            <Label htmlFor="description" className={isInDialog ? 'text-xs sm:text-sm' : ''}>Description</Label>
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
            <Label htmlFor="category" className={isInDialog ? 'text-xs sm:text-sm' : ''}>Category</Label>
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
            <Label htmlFor="utilityType" className={isInDialog ? 'text-xs sm:text-sm' : ''}>
              Utility Type {category !== 'SAVINGS' && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={utilityType} 
              onValueChange={setUtilityType} 
              required={category !== 'SAVINGS'}
              disabled={loadingUtilities || category === 'SAVINGS'}
            >
              <SelectTrigger id="utilityType" className="backdrop-blur-sm bg-white/50 dark:bg-white/5">
                {loadingUtilities ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading utilities...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={
                    category === 'SAVINGS' ? "Not applicable for savings" : 
                    "Select utility type"
                  } />
                )}
              </SelectTrigger>
              <SelectContent>
                {loadingUtilities ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading utility types...</span>
                  </div>
                ) : utilityTypes.length === 0 ? (
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
            <Label htmlFor="date" className={isInDialog ? 'text-xs sm:text-sm' : ''}>Date</Label>
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
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                sideOffset={5}
                alignOffset={-20}
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className={`${isInDialog ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
              Leave empty to use today's date
            </p>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Label htmlFor="receipt" className={isInDialog ? 'text-xs sm:text-sm' : ''}>Receipt (Optional)</Label>
            <div className="space-y-2">
              {!receipt && (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Paperclip className="w-8 h-8 mb-2 text-gray-400" />
                      <p className={`mb-2 ${isInDialog ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                        <span className="font-semibold">Click to upload</span> receipt
                      </p>
                      <p className={`${isInDialog ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>PNG, JPG, WebP or PDF (MAX. 2MB)</p>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleReceiptUpload}
                    />
                  </label>
                </div>
              )}
              
              {receipt && (
                <div className="relative p-4 border rounded-lg bg-white/50 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className={`${isInDialog ? 'text-xs' : 'text-sm'} font-medium`}>{receipt.name}</p>
                        <p className={`${isInDialog ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                          {(receipt.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {receiptPreview && (
                    <div className="mt-3">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
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