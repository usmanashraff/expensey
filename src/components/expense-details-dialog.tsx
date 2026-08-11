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
      <DialogContent className="sm:max-w-[600px] bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant rounded-xl shadow-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-low border border-outline-variant/50 shadow-sm`}>
              <span className="material-symbols-outlined text-[28px] text-tertiary">receipt_long</span>
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl sm:text-2xl font-bold font-serif-heading text-center text-on-surface">Expense Details</DialogTitle>
          <DialogDescription className="text-center font-sans font-medium text-on-surface-variant mt-1">
            {format(new Date(expense.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          <div className="space-y-6 mt-4">
            {/* Main Details */}
            <motion.div 
              className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">sell</span>
                    <span className="font-sans font-medium text-sm">Description</span>
                  </div>
                  <span className="font-sans font-semibold text-on-surface">{expense.description}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    <span className="font-sans font-medium text-sm">Amount</span>
                  </div>
                  <span className="font-sans font-bold text-xl text-on-surface">
                    {formatCurrencyWithMask(showAmounts, expense.amount, expense.currency || 'PKR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span className="font-sans font-medium text-sm">Date & Time</span>
                  </div>
                  <span className="font-sans font-medium text-sm text-on-surface">
                    {format(new Date(expense.date), 'MMM d, yyyy')} at {format(new Date(expense.date), 'h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-sans font-medium text-sm text-on-surface-variant">Category</span>
                  <span className={`font-sans font-semibold text-xs px-3 py-1 rounded-lg ${config.bgColor} ${config.textColor}`}>
                    {config.label}
                  </span>
                </div>
                
                {expense.subcategory && (
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-medium text-sm text-on-surface-variant">Utility Type</span>
                    <span className="font-sans font-semibold text-xs px-3 py-1 rounded-lg bg-[#ffffff] text-[#171c1f] dark:bg-[#14171a] dark:text-[#f6fafe] border border-outline-variant">
                      {expense.subcategory}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

          {/* Receipt Section */}
          <motion.div 
            className="p-5 rounded-xl bg-[#ffffff] dark:bg-[#14171a] border border-outline-variant/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-base font-semibold flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-[18px]">attach_file</span>
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
                  <div key={index} className="space-y-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant/50">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-medium text-sm text-on-surface">Receipt {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newShowReceipts = [...showReceipts]
                            newShowReceipts[index] = !newShowReceipts[index]
                            setShowReceipts(newShowReceipts)
                          }}
                          className="h-8 w-8 p-0 text-on-surface-variant hover:text-[#171c1f] hover:bg-[#eaeef2] dark:hover:text-[#f6fafe] dark:hover:bg-[#24282c] rounded-lg"
                        >
                          {showReceipts[index] ? <span className="material-symbols-outlined text-[18px]">visibility_off</span> : <span className="material-symbols-outlined text-[18px]">visibility</span>}
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
                        className="flex-1 font-sans font-semibold rounded-lg bg-[#ffffff] hover:bg-[#eaeef2] text-[#171c1f] dark:bg-[#14171a] dark:hover:bg-[#24282c] dark:text-[#f6fafe] border-outline-variant"
                      >
                        <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveReceipt(index)}
                        disabled={deletingReceiptIndex === index}
                        className="flex-1 font-sans font-semibold rounded-lg border-outline-variant text-[#ba1a1a] hover:bg-[#ffdad6] hover:border-[#ba1a1a] dark:hover:bg-[#93000a]/20"
                      >
                        {deletingReceiptIndex === index ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px] mr-2">close</span>
                        )}
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-outline-variant rounded-xl">
                <p className="font-sans text-sm text-on-surface-variant mb-3">No receipts attached</p>
                <div className="flex justify-center">
                  <label htmlFor="receipt-upload-dialog">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingReceipt}
                      asChild
                      className="font-sans font-semibold rounded-lg bg-[#ffffff] hover:bg-[#eaeef2] text-[#171c1f] dark:bg-[#14171a] dark:hover:bg-[#24282c] dark:text-[#f6fafe] border-outline-variant"
                    >
                      <span className="flex items-center cursor-pointer">
                        {uploadingReceipt ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px] mr-2">add</span>
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
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t border-outline-variant flex-col sm:flex-row gap-2 mt-auto">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto font-sans font-semibold rounded-lg border-outline-variant text-[#ba1a1a] hover:bg-[#ffdad6] hover:border-[#ba1a1a] dark:hover:bg-[#93000a]/20"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                Delete Expense
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-sans font-semibold rounded-lg bg-[#f0f4f8] hover:bg-[#eaeef2] text-[#171c1f] dark:bg-[#1c2024] dark:hover:bg-[#24282c] dark:text-[#f6fafe] border-outline-variant"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">close</span>
            Close
          </Button>
        </DialogFooter>
        
        {/* Decorative elements removed for minimal styling */}
      </DialogContent>
    </Dialog>
  )
}