'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  HandCoins, Landmark, Plus, Trash2, CheckCircle2, Clock, 
  ArrowUpRight, ArrowDownRight, Loader2, Sparkles, AlertCircle, Eye, EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

export interface Loan {
  id: string
  personName: string
  amount: number
  type: 'GIVEN' | 'TAKEN'
  status: 'PENDING' | 'RELEASED'
  description?: string | null
  date: string
  releasedAt?: string | null
  currency: string
}

interface LoansManagerProps {
  onSavingsChange?: () => void
  showAmounts?: boolean
}

export function LoansManager({ onSavingsChange, showAmounts = true }: LoansManagerProps) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'given' | 'taken' | 'released'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [releasingId, setReleasingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [releasingLoan, setReleasingLoan] = useState<Loan | null>(null)

  // Form states
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'GIVEN' | 'TAKEN'>('GIVEN')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/loans')
      if (res.ok) {
        const data = await res.json()
        setLoans(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!personName.trim() || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid person name and positive amount')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: personName.trim(),
          amount: numAmount,
          type,
          description: description.trim(),
          date,
        }),
      })

      if (res.ok) {
        toast.success(type === 'GIVEN' ? 'Given loan recorded successfully!' : 'Taken loan recorded successfully!')
        setShowAddDialog(false)
        resetForm()
        await fetchLoans()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create loan')
      }
    } catch (error) {
      console.error('Error adding loan:', error)
      toast.error('An error occurred while adding loan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmRelease = async () => {
    if (!releasingLoan) return
    const loan = releasingLoan

    setReleasingId(loan.id)
    try {
      const res = await fetch(`/api/loans/${loan.id}/release`, {
        method: 'POST',
      })

      if (res.ok) {
        if (loan.type === 'GIVEN') {
          toast.success(`Loan to ${loan.personName} released! Added ${formatCurrency(loan.amount, 'PKR')} to Savings.`)
        } else {
          toast.success(`Loan from ${loan.personName} released! Deducted ${formatCurrency(loan.amount, 'PKR')} from Savings.`)
        }
        setReleasingLoan(null)
        await fetchLoans()
        onSavingsChange?.()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to release loan')
      }
    } catch (error) {
      console.error('Error releasing loan:', error)
      toast.error('An error occurred while releasing loan')
    } finally {
      setReleasingId(null)
    }
  }

  const handleDeleteLoan = async (loanId: string) => {
    setDeletingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Loan record deleted')
        await fetchLoans()
        onSavingsChange?.()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete loan')
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
      toast.error('An error occurred while deleting loan')
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setPersonName('')
    setAmount('')
    setType('GIVEN')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
  }

  // Calculate statistics
  const activeGivenLoans = loans.filter(l => l.type === 'GIVEN' && l.status === 'PENDING')
  const activeTakenLoans = loans.filter(l => l.type === 'TAKEN' && l.status === 'PENDING')
  const releasedLoans = loans.filter(l => l.status === 'RELEASED')

  const totalGivenAmount = activeGivenLoans.reduce((sum, l) => sum + l.amount, 0)
  const totalTakenAmount = activeTakenLoans.reduce((sum, l) => sum + l.amount, 0)
  const netLoanBalance = totalGivenAmount - totalTakenAmount

  // Filtered loans list
  const filteredLoans = loans.filter(l => {
    if (activeTab === 'given') return l.type === 'GIVEN' && l.status === 'PENDING'
    if (activeTab === 'taken') return l.type === 'TAKEN' && l.status === 'PENDING'
    if (activeTab === 'released') return l.status === 'RELEASED'
    return true
  })

  const [isAmountVisible, setIsAmountVisible] = useState(showAmounts)

  const formatDisplayAmount = (val: number, currency: string = 'PKR') => {
    if (!isAmountVisible) return 'PKR ****'
    return formatCurrency(val, currency)
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <HandCoins className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Loans Tracker
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAmountVisible(!isAmountVisible)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title={isAmountVisible ? "Hide amounts" : "Show amounts"}
            >
              {isAmountVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage given (lent) and taken (borrowed) loans. Releasing a loan updates your savings.
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-md rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Loan
        </Button>
      </div>

      {/* Summary Cards (Hidden on small screens) */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Given Loans (To Collect) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Loans Given (To Collect)
                </span>
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatDisplayAmount(totalGivenAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeGivenLoans.length} active given loan{activeGivenLoans.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Taken Loans (To Pay) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Loans Taken (To Pay)
                </span>
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">
                {formatDisplayAmount(totalTakenAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTakenLoans.length} active taken loan{activeTakenLoans.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Position */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Net Loan Position
                </span>
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  <Landmark className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${netLoanBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatDisplayAmount(netLoanBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {netLoanBalance >= 0 ? 'Net Receivable' : 'Net Payable'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Released Loans */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Released / Settled
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {releasedLoans.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed loan transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Tabs & Main Card List */}
      <Card className="backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Loans Overview</CardTitle>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-white/60 dark:bg-[oklch(0.25_0.02_250)]/60">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="given" className="text-xs sm:text-sm">Given</TabsTrigger>
                <TabsTrigger value="taken" className="text-xs sm:text-sm">Taken</TabsTrigger>
                <TabsTrigger value="released" className="text-xs sm:text-sm">Released</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Loading loans...
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-3">
              <HandCoins className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-base font-medium">No loans found</p>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'all' ? 'Start by adding a given or taken loan!' : `No ${activeTab} loans present.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Loan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredLoans.map((loan) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-purple-500/30 transition-all shadow-sm"
                  >
                    {/* Left details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base sm:text-lg text-foreground">
                          {loan.personName}
                        </span>
                        
                        {/* Type Badge */}
                        {loan.type === 'GIVEN' ? (
                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20">
                            Given (To Collect)
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20">
                            Taken (To Pay)
                          </Badge>
                        )}

                        {/* Status Badge */}
                        {loan.status === 'RELEASED' ? (
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Released
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Active (Pending)
                          </Badge>
                        )}
                      </div>

                      {loan.description && (
                        <p className="text-sm text-muted-foreground">{loan.description}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(loan.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {loan.status === 'RELEASED' && loan.releasedAt && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                            • Released on: {new Date(loan.releasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Right actions & amount */}
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className={`text-lg sm:text-xl font-bold ${
                          loan.type === 'GIVEN' ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {formatDisplayAmount(loan.amount, loan.currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {loan.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => setReleasingLoan(loan)}
                            disabled={releasingId === loan.id}
                            className={
                              loan.type === 'GIVEN'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm text-xs sm:text-sm'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-sm text-xs sm:text-sm'
                            }
                          >
                            {releasingId === loan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Release Loan
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLoan(loan.id)}
                          disabled={deletingId === loan.id}
                          className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Loan"
                        >
                          {deletingId === loan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Loan Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-lg sm:text-xl">
              <HandCoins className="h-5 w-5" />
              Add Loan Record
            </DialogTitle>
            <DialogDescription>
              Record a loan given out to someone or taken from a lender.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLoan} className="space-y-4 pt-2">
            {/* Loan Type selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Loan Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={type === 'GIVEN' ? 'default' : 'outline'}
                  onClick={() => setType('GIVEN')}
                  className={type === 'GIVEN' ? 'bg-purple-600 hover:bg-purple-700 text-white font-medium' : ''}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Given (Lent)
                </Button>
                <Button
                  type="button"
                  variant={type === 'TAKEN' ? 'default' : 'outline'}
                  onClick={() => setType('TAKEN')}
                  className={type === 'TAKEN' ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium' : ''}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Taken (Borrowed)
                </Button>
              </div>
            </div>

            {/* Person Name */}
            <div className="space-y-2">
              <Label htmlFor="personName">{type === 'GIVEN' ? 'Borrower Name (Person Given To)' : 'Lender Name (Person Taken From)'}</Label>
              <Input
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={type === 'GIVEN' ? 'e.g. Ali Ahmed' : 'e.g. Uncle Bilal'}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Loan Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Notes / Purpose (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional loan description or repayment notes..."
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  resetForm()
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Loan Record'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Release Loan Confirmation Dialog */}
      <Dialog open={!!releasingLoan} onOpenChange={(open) => !open && setReleasingLoan(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Release & Settle Loan
            </DialogTitle>
            <DialogDescription>
              {releasingLoan?.type === 'GIVEN'
                ? `Confirm that ${releasingLoan.personName} has repaid this loan of ${formatCurrency(releasingLoan.amount, 'PKR')}. This amount will be ADDED to your current month & total savings.`
                : `Confirm that you have repaid this loan of ${formatCurrency(releasingLoan?.amount || 0, 'PKR')} to ${releasingLoan?.personName}. This amount will be DEDUCTED from your current month & total savings.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setReleasingLoan(null)}
              disabled={!!releasingId}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRelease}
              disabled={!!releasingId}
              className={releasingLoan?.type === 'GIVEN' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}
            >
              {releasingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing...
                </>
              ) : (
                'Confirm Release'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
