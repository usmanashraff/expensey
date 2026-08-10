'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Sparkles, Keyboard, ChevronDown, ChevronUp, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NaturalLanguageInput from './natural-language-input'
import { ExpenseForm } from './expense-form'

interface SmartExpenseInputProps {
  onExpenseAdded: (expense?: any) => void
  utilityRefreshTrigger?: number
  utilityTypes?: string[]
  onClose?: () => void
}

export default function SmartExpenseInput({ 
  onExpenseAdded, 
  utilityRefreshTrigger,
  utilityTypes = [],
  onClose
}: SmartExpenseInputProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual')
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.div
      animate={{ height: isCollapsed ? 'auto' : 'auto' }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card className="relative backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10" />
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-base sm:text-lg">Add Expense</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Use AI or manual entry
                </CardDescription>
              </div>
            </div>
            {onClose ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="relative z-10 pt-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ai' | 'manual')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">AI Input</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Keyboard className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">Manual</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ai" className="mt-0 -mx-6 px-6">
                    <div className="-mt-4">
                      <NaturalLanguageInput 
                        onExpenseAdded={onExpenseAdded} 
                        utilityTypes={utilityTypes}
                        compact={true}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-0 -mx-6 px-6">
                    <div className="-mt-4">
                      <ExpenseForm 
                        onExpenseAdded={onExpenseAdded}
                        utilityRefreshTrigger={utilityRefreshTrigger}
                        compact={true}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}