'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Settings, ChevronLeft, ChevronRight, ChevronDown, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UtilityType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface UtilityTypeManagerProps {
  onUtilityTypesChanged?: () => void
}

export function UtilityTypeManager({ onUtilityTypesChanged }: UtilityTypeManagerProps) {
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [showManager, setShowManager] = useState(false)
  
  const itemsPerPage = 4
  const totalPages = Math.ceil(utilityTypes.length / itemsPerPage)

  const fetchUtilityTypes = async () => {
    try {
      const response = await fetch('/api/utility-types')
      if (!response.ok) throw new Error('Failed to fetch utility types')
      const data = await response.json()
      setUtilityTypes(data)
    } catch (error) {
      console.error('Failed to fetch utility types:', error)
      toast.error('Failed to load utility types')
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
    <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg"
            >
              <Settings className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-xl">Manage Utility Types</CardTitle>
              {showManager && (
                <CardDescription className="mt-1">Create and manage utility categories</CardDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManager(!showManager)}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: showManager ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="h-4 w-4"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            {showManager ? 'Hide' : 'Show'}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: "easeInOut" },
              opacity: { duration: 0.3, ease: "easeInOut" }
            }}
            className="overflow-hidden"
          >
            <CardContent className="relative z-10">
              <motion.form 
                onSubmit={handleAddType} 
                className="flex gap-2 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  placeholder="Enter new utility type"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  disabled={isAdding}
                  className="flex-1 backdrop-blur-sm bg-white/50 dark:bg-white/5"
                />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    disabled={isAdding}
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </motion.div>
              </motion.form>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Current Utility Types {utilityTypes.length > 0 && `(${utilityTypes.length} total)`}
                  </Label>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {utilityTypes.length === 0 ? (
                  <motion.p 
                    className="text-center text-muted-foreground py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    No utility types yet. Add your first one above!
                  </motion.p>
                ) : (
                  <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        {getCurrentPageItems().map((type, index) => (
                          <motion.div
                            key={type.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between p-4 rounded-2xl border bg-white/30 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                          >
                            <span className="font-medium text-sm truncate mr-2">
                              {type.name}
                            </span>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteType(type.id, type.name)}
                                disabled={isLoading}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Decorative element */}
      <motion.div
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-400/20 blur-2xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 0]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </Card>
  )
}