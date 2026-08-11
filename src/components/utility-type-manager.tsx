'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Settings, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UtilityType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface UtilityTypeManagerProps {
  onUtilityTypesChanged?: () => void
  isInDialog?: boolean
  onClose?: () => void
}

export function UtilityTypeManager({ onUtilityTypesChanged, isInDialog = false, onClose }: UtilityTypeManagerProps) {
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [showManager, setShowManager] = useState(true)
  const [isFetching, setIsFetching] = useState(true)
  
  const itemsPerPage = 4
  const totalPages = Math.ceil(utilityTypes.length / itemsPerPage)

  const fetchUtilityTypes = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/utility-types')
      if (!response.ok) throw new Error('Failed to fetch utility types')
      const data = await response.json()
      setUtilityTypes(data)
    } catch (error) {
      console.error('Failed to fetch utility types:', error)
      toast.error('Failed to load utility types')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchUtilityTypes()
  }, [])

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTypeName.trim()) {
      toast.error('Please enter a utility type name')
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch('/api/utility-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTypeName }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create utility type:', error)
        throw new Error(error.error || 'Failed to add utility type')
      }

      const newType = await response.json()
      setUtilityTypes([...utilityTypes, newType])
      setNewTypeName('')
      toast.success('Utility type added successfully!')
      onUtilityTypesChanged?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add utility type')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/utility-types?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete utility type')
      }

      setUtilityTypes(utilityTypes.filter(type => type.id !== id))
      toast.success('Utility type deleted successfully!')
      onUtilityTypesChanged?.()
    } catch (error) {
      toast.error('Failed to delete utility type')
    } finally {
      setIsLoading(false)
    }
  }

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return utilityTypes.slice(startIndex, endIndex)
  }

  // Reset to first page when items change
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1)
    }
  }, [utilityTypes.length, currentPage, totalPages])

  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 relative overflow-hidden shadow-sm">
      {/* Decorative subtle background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#b0c9e3]/20 dark:bg-[#b0c9e3]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-outline-variant/50">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-12 h-12 rounded-lg bg-[#f6f9ff] dark:bg-[#14171a] flex items-center justify-center border border-[#b0c9e3] dark:border-[#353a40] shrink-0">
            <span className="material-symbols-outlined text-tertiary dark:text-on-surface text-2xl">settings_applications</span>
          </div>
          <div>
            <h3 className="font-serif-heading text-2xl font-medium text-on-surface mb-1">Manage Utility Types</h3>
            <p className="font-sans text-base text-on-surface-variant">Create and manage utility categories for financial categorization.</p>
          </div>
        </div>
        {isInDialog && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-full self-start md:self-auto"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="relative z-10">
        {/* Input Section */}
        <form onSubmit={handleAddType} className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              disabled={isAdding}
              placeholder="Enter new utility type"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-sans text-base text-on-surface focus:border-[#496177] dark:focus:border-[#f6fafe] focus:ring-1 focus:ring-[#496177]/20 dark:focus:ring-[#f6fafe]/20 transition-all shadow-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="bg-[#212529] hover:bg-black text-white dark:bg-[#f6fafe] dark:hover:bg-white dark:text-[#14171a] font-sans text-sm font-semibold tracking-wide px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-70"
          >
            {isAdding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">add</span>
            )}
            Add
          </button>
        </form>

        {/* List Section */}
        {isFetching ? (
          <div className="py-12 flex justify-center items-center gap-2 text-on-surface-variant">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-sans text-sm">Loading types...</span>
          </div>
        ) : utilityTypes.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant">
            <Settings className="h-12 w-12 mx-auto text-[#c4c7c8] dark:text-[#353a40] mb-4" />
            <p className="font-sans text-base">No utility types created yet</p>
            <p className="font-sans text-sm mt-1">Add your first category above</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-lg">list</span>
                <span className="font-sans text-sm font-semibold tracking-wide">Utility Types ({utilityTypes.length} total)</span>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="p-1 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 rounded-full hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="font-sans text-xs text-on-surface-variant font-medium">{currentPage + 1} / {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-1 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 rounded-full hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {getCurrentPageItems().map((type) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex justify-between items-center hover:bg-surface-container hover:border-[#747879] dark:hover:border-[#5b5f63] transition-all group shadow-xs"
                  >
                    <span className="font-sans text-base text-on-surface">{type.name}</span>
                    <button 
                      onClick={() => handleDeleteType(type.id, type.name)}
                      disabled={isLoading}
                      className="text-[#ba1a1a]/70 hover:text-[#ba1a1a] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-lg">delete</span>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}