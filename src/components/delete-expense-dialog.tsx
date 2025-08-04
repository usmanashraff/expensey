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
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrencyWithMask } from '@/lib/currency'

interface DeleteExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  expense: {
    description: string
    amount: number
    currency: string
    category: string
  } | null
  showAmounts: boolean
}

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  onConfirm,
  expense,
  showAmounts
}: DeleteExpenseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!expense) return null

  const categoryColors = {
    NEED: 'from-yellow-500 to-orange-500',
    WANT: 'from-red-500 to-pink-500',
    SELF_DEVELOPMENT: 'from-green-500 to-emerald-500',
    SAVINGS: 'from-blue-500 to-cyan-500',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/80 dark:bg-[oklch(0.2_0.02_250)]/80 border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 dark:from-gray-500/10 dark:to-slate-500/10" />
        
        <DialogHeader className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gray-400 rounded-full blur-xl opacity-30" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl font-bold text-center text-gray-900 dark:text-gray-100">
            Delete Expense
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="my-6 p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className={`font-bold text-lg bg-gradient-to-r ${categoryColors[expense.category as keyof typeof categoryColors]} bg-clip-text text-transparent`}>
                {formatCurrencyWithMask(showAmounts, expense.amount, expense.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[expense.category as keyof typeof categoryColors]} text-white font-medium`}>
                {expense.category.replace('_', ' ')}
              </span>
            </div>
          </div>
        </motion.div>
        
        <DialogFooter className="relative z-10 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-300/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <AnimatePresence mode="wait">
                {isDeleting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </motion.div>
                ) : (
                  <motion.div
                    key="delete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Expense
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </DialogFooter>
        
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-gray-400/10 to-slate-400/10 blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-slate-400/10 to-gray-400/10 blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
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