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
      {/* Header Section */}
      <div className="hidden sm:flex justify-end items-center mb-6 gap-4">
        <button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#212529] dark:bg-[#f6fafe] text-white dark:text-[#14171a] font-sans text-sm font-semibold tracking-wide px-6 py-3 rounded-full flex items-center gap-2 hover:bg-black dark:hover:bg-white transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add New Loan
        </button>
      </div>

      {/* Status Cards Bento Grid */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Card 1 */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant flex flex-col justify-between min-h-[140px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Loans Given (To Collect)</span>
              <span className="material-symbols-outlined text-tertiary dark:text-on-surface">call_made</span>
            </div>
            <div>
              <div className="font-serif-heading text-2xl font-medium text-on-surface mt-4">{formatDisplayAmount(totalGivenAmount)}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1">{activeGivenLoans.length} active given loans</div>
            </div>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant flex flex-col justify-between min-h-[140px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Loans Taken (To Pay)</span>
              <span className="material-symbols-outlined text-on-surface-variant">call_received</span>
            </div>
            <div>
              <div className="font-serif-heading text-2xl font-medium text-on-surface mt-4">{formatDisplayAmount(totalTakenAmount)}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1">{activeTakenLoans.length} active taken loans</div>
            </div>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant flex flex-col justify-between min-h-[140px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Net Loan Position</span>
              <span className="material-symbols-outlined text-tertiary dark:text-on-surface">account_balance</span>
            </div>
            <div>
              <div className={`font-serif-heading text-2xl font-medium mt-4 ${netLoanBalance >= 0 ? 'text-on-surface' : 'text-[#ba1a1a]'}`}>{formatDisplayAmount(netLoanBalance)}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1">{netLoanBalance >= 0 ? 'Net Receivable' : 'Net Payable'}</div>
            </div>
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="bg-[#ffffff] dark:bg-[#14171a] rounded-xl p-6 border border-outline-variant flex flex-col justify-between min-h-[140px] shadow-sm hover:border-[#496177]/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Released / Settled</span>
              <span className="material-symbols-outlined text-on-surface-variant">check_circle</span>
            </div>
            <div>
              <div className="font-serif-heading text-2xl font-medium text-on-surface mt-4">{releasedLoans.length}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1">Completed loan transactions</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overview Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <h4 className="font-serif-heading text-xl font-medium text-on-surface">Loans Overview</h4>
          <button
            onClick={() => setIsAmountVisible(!isAmountVisible)}
            className="p-2 -ml-1 text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container shrink-0"
            title={isAmountVisible ? "Hide amounts" : "Show amounts"}
          >
            <span className="material-symbols-outlined text-[20px]">{isAmountVisible ? 'visibility' : 'visibility_off'}</span>
          </button>
        </div>
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full font-sans text-sm font-semibold tracking-wide transition-all ${activeTab === 'all' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >All</button>
          <button 
            onClick={() => setActiveTab('given')}
            className={`px-4 py-1.5 rounded-full font-sans text-sm font-semibold tracking-wide transition-all ${activeTab === 'given' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >Given</button>
          <button 
            onClick={() => setActiveTab('taken')}
            className={`px-4 py-1.5 rounded-full font-sans text-sm font-semibold tracking-wide transition-all ${activeTab === 'taken' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >Taken</button>
          <button 
            onClick={() => setActiveTab('released')}
            className={`px-4 py-1.5 rounded-full font-sans text-sm font-semibold tracking-wide transition-all ${activeTab === 'released' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >Released</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-[#5b5f63] flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#496177] mb-2" />
          <p className="font-sans text-sm">Loading loans...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="py-12 text-center text-[#5b5f63] space-y-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-[#5b5f63]/40">account_balance</span>
          <p className="text-base font-medium text-on-surface">No loans found</p>
          <p className="text-sm font-sans">
            {activeTab === 'all' ? 'Start by adding a given or taken loan!' : `No ${activeTab} loans present.`}
          </p>
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
                className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-[#496177]/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h5 className="font-sans text-lg font-medium text-on-surface">{loan.personName}</h5>
                    
                    {/* Type Pill */}
                    {loan.type === 'GIVEN' ? (
                      <span className="bg-surface-container px-2.5 py-1 rounded-full font-sans text-xs font-semibold text-on-surface-variant flex items-center gap-1 border border-outline-variant/50">
                        Given (To Collect)
                      </span>
                    ) : (
                      <span className="bg-surface-container px-2.5 py-1 rounded-full font-sans text-xs font-semibold text-on-surface-variant flex items-center gap-1 border border-outline-variant/50">
                        Taken (To Pay)
                      </span>
                    )}

                    {/* Status Pill */}
                    {loan.status === 'RELEASED' ? (
                      <span className="bg-[#cce5ff]/20 dark:bg-[#cce5ff]/10 px-2.5 py-1 rounded-full font-sans text-xs font-semibold text-tertiary flex items-center gap-1 border border-[#496177]/30">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Released
                      </span>
                    ) : (
                      <span className="bg-[#ffffff] dark:bg-[#14171a] px-2.5 py-1 rounded-full font-sans text-xs font-semibold text-on-surface flex items-center gap-1 border border-outline-variant">
                        <span className="material-symbols-outlined text-[14px]">pending</span>
                        Active (Pending)
                      </span>
                    )}
                  </div>
                  
                  {loan.description && (
                    <p className="font-sans text-base text-on-surface-variant">{loan.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 font-sans text-xs font-medium text-on-surface-variant">
                    <span>Date: {new Date(loan.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {loan.status === 'RELEASED' && loan.releasedAt && (
                      <>
                        <span>•</span>
                        <span className="text-tertiary">Released on: {new Date(loan.releasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  <div className="font-serif-heading text-2xl font-medium text-on-surface mr-2">
                    {formatDisplayAmount(loan.amount, loan.currency)}
                  </div>
                  
                  {loan.status === 'PENDING' && (
                    <button
                      onClick={() => setReleasingLoan(loan)}
                      disabled={releasingId === loan.id}
                      className="border border-[#496177] dark:border-[#f6fafe] text-tertiary dark:text-on-surface font-sans text-sm font-semibold tracking-wide px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#496177] hover:text-white dark:hover:bg-white dark:hover:text-[#14171a] transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {releasingId === loan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Release Loan
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteLoan(loan.id)}
                    disabled={deletingId === loan.id}
                    className="text-on-surface-variant hover:text-[#ba1a1a] dark:hover:text-[#ffdad6] transition-colors p-2 disabled:opacity-50"
                  >
                    {deletingId === loan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined">delete</span>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}


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
      
      {/* Floating Add Loan Button for Mobile */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          onClick={() => setShowAddDialog(true)}
          className="rounded-full h-14 w-14 shadow-xl bg-[#212529] hover:bg-[#343a40] text-white dark:bg-[#e4e4cc] dark:text-[#1c1c1a] p-0 flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>
    </div>
  )
}
