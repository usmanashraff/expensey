'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Receipt, 
  Calendar, 
  Wallet, 
  Tag, 
  X, 
  Download, 
  Trash2, 
  Plus,
  Paperclip,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrencyWithMask } from '@/lib/currency'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Expense } from '@/generated/prisma'

interface ExpenseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  showAmounts: boolean
  onDelete: () => void
  onUpdate: () => void
}

export function ExpenseDetailsDialog({
  open,
  onOpenChange,
  expense,
  showAmounts,
  onDelete,
  onUpdate
}: ExpenseDetailsDialogProps) {
  const [showReceipts, setShowReceipts] = useState<boolean[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [deletingReceiptIndex, setDeletingReceiptIndex] = useState<number | null>(null)

  if (!expense) return null

  // Get all receipts (migrate from old single receipt to new array format)
  const allReceipts = expense.receipts && expense.receipts.length > 0 
    ? expense.receipts 
    : expense.receipt 
    ? [expense.receipt]
    : []

  const categoryConfig = {
    NEED: { 
      label: 'Needs',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-300'
    },
    WANT: {
      label: 'Wants',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-300'
    },
    SELF_DEVELOPMENT: {
      label: 'Self Development',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300'
    },
    SAVINGS: {
      label: 'Savings',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300'
    },
  }

  const config = categoryConfig[expense.category as keyof typeof categoryConfig]

  const handleDownloadReceipt = (receiptData: string, index: number) => {
    try {
      const matches = receiptData.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        toast.error('Invalid receipt format')
        return
      }

      const mimeType = matches[1]
      const base64Data = matches[2]
      
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const extension = mimeType.includes('pdf') ? 'pdf' : 
                       mimeType.includes('png') ? 'png' : 
                       mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 
                       'webp'
      const date = new Date(expense.date).toISOString().split('T')[0]
      a.download = `receipt_${expense.description.replace(/\s+/g, '_')}_${date}_${index + 1}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Receipt downloaded!')
    } catch (error) {
      toast.error('Failed to download receipt')
    }
  }

  const handleRemoveReceipt = async (index: number) => {
    setDeletingReceiptIndex(index)
    try {
      const newReceipts = [...allReceipts]
      newReceipts.splice(index, 1)
      
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receipts: newReceipts,
          receipt: newReceipts.length > 0 ? newReceipts[0] : null // Keep first receipt for backward compatibility
        })
      })

      if (!response.ok) throw new Error('Failed to remove receipt')
      
      toast.success('Receipt removed successfully!')
      onUpdate()
    } catch (error) {
      toast.error('Failed to remove receipt')
    } finally {
      setDeletingReceiptIndex(null)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Limit to 5 receipts total
    if (allReceipts.length + files.length > 5) {
      toast.error('Maximum 5 receipts allowed per expense')
      return
    }

    setUploadingReceipt(true)

    try {
      const newReceipts: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: Invalid file type. Please upload images or PDF`)
          continue
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`${file.name}: File size must be less than 2MB`)
          continue
        }

        // Convert to base64
        const reader = new FileReader()
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        newReceipts.push(base64Data)
      }

      if (newReceipts.length === 0) {
        toast.error('No valid files to upload')
        return
      }

      // Update expense with new receipts
      const updatedReceipts = [...allReceipts, ...newReceipts]
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receipts: updatedReceipts,
          receipt: updatedReceipts[0] // Keep first receipt for backward compatibility
        })
      })

      if (!response.ok) throw new Error('Failed to upload receipts')
      
      toast.success(`${newReceipts.length} receipt${newReceipts.length > 1 ? 's' : ''} uploaded successfully!`)
      onUpdate()
    } catch (error) {
      toast.error('Failed to upload receipts')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] backdrop-blur-xl bg-white/80 dark:bg-[oklch(0.2_0.02_250)]/80 border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
        
        <DialogHeader className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg`}>
              <Receipt className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl font-bold text-center">Expense Details</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {format(new Date(expense.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-6 relative z-10">
          {/* Main Details */}
          <motion.div 
            className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">Description</span>
                </div>
                <span className="font-medium">{expense.description}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">Amount</span>
                </div>
                <span className={`font-bold text-xl bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                  {formatCurrencyWithMask(showAmounts, expense.amount, expense.currency || 'PKR')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Date & Time</span>
                </div>
                <span className="text-sm">
                  {format(new Date(expense.date), 'MMM d, yyyy')} at {format(new Date(expense.date), 'h:mm a')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className={`text-xs px-3 py-1 rounded-full ${config.bgColor} ${config.textColor} font-medium`}>
                  {config.label}
                </span>
              </div>
              
              {expense.subcategory && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Utility Type</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {expense.subcategory}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Receipt Section */}
          <motion.div 
            className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Receipts {allReceipts.length > 0 && `(${allReceipts.length})`}
              </h3>
              {allReceipts.length < 5 && (
                <label htmlFor="receipt-upload-dialog">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingReceipt}
                    asChild
                  >
                    <span>
                      {uploadingReceipt ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add
                    </span>
                  </Button>
                </label>
              )}
            </div>
            
            {allReceipts.length > 0 ? (
              <div className="space-y-3">
                {allReceipts.map((receiptData, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Receipt {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newShowReceipts = [...showReceipts]
                            newShowReceipts[index] = !newShowReceipts[index]
                            setShowReceipts(newShowReceipts)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {showReceipts[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {showReceipts[index] && receiptData.includes('image') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-lg"
                        >
                          <img 
                            src={receiptData} 
                            alt={`Receipt ${index + 1}`} 
                            className="w-full rounded-lg"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(receiptData, index)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveReceipt(index)}
                        disabled={deletingReceiptIndex === index}
                        className="flex-1"
                      >
                        {deletingReceiptIndex === index ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No receipts attached</p>
                <div className="flex justify-center">
                  <label htmlFor="receipt-upload-dialog">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingReceipt}
                      asChild
                    >
                      <span>
                        {uploadingReceipt ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Receipts
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
            
            <input
              id="receipt-upload-dialog"
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              disabled={uploadingReceipt}
              multiple
            />
          </motion.div>
        </div>
        
        <DialogFooter className="relative z-10 flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Expense
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
        
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-2xl"
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
      </DialogContent>
    </Dialog>
  )
}