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
      <Card className="bg-[#ffffff] dark:bg-[#14171a] border-outline-variant shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant/50 shadow-sm"
              >
                <span className="material-symbols-outlined text-[24px] text-tertiary">add_card</span>
              </motion.div>
              <div>
                <CardTitle className="text-on-surface text-xl font-serif-heading font-bold">Add Expense</CardTitle>
                <CardDescription className="font-sans font-medium text-on-surface-variant mt-1 text-sm">
                  Use AI or manual entry
                </CardDescription>
              </div>
            </div>
            {onClose ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-on-surface-variant hover:text-[#171c1f] hover:bg-[#eaeef2] dark:hover:text-[#f6fafe] dark:hover:bg-[#24282c] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
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
              <CardContent className="p-6 pt-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ai' | 'manual')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-surface-container-low p-1 rounded-xl">
                    <TabsTrigger value="ai" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-[#ffffff] data-[state=active]:text-[#171c1f] dark:data-[state=active]:bg-[#14171a] dark:data-[state=active]:text-[#f6fafe] data-[state=active]:shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                      <span className="font-sans font-semibold text-sm">AI Input</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-[#ffffff] data-[state=active]:text-[#171c1f] dark:data-[state=active]:bg-[#14171a] dark:data-[state=active]:text-[#f6fafe] data-[state=active]:shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">keyboard</span>
                      <span className="font-sans font-semibold text-sm">Manual</span>
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