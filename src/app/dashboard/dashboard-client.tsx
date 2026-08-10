'use client'

import { useState, useEffect } from 'react'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { UtilityTypeManager } from '@/components/utility-type-manager'
import { UserDropdown } from '@/components/user-dropdown'
import SmartExpenseInput from '@/components/smart-expense-input'
import { DashboardSidebar, MenuId } from '@/components/dashboard-sidebar'
import { Menu, Plus, PanelLeft, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DashboardClientProps {
  user: {
    id: string
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [utilityRefreshTrigger, setUtilityRefreshTrigger] = useState(0)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showUtilityDialog, setShowUtilityDialog] = useState(false)
  const [optimisticExpense, setOptimisticExpense] = useState<any>(null)
  const [utilityTypes, setUtilityTypes] = useState<string[]>([])

  // Fetch utility types for natural language processing
  useEffect(() => {
    const fetchUtilityTypes = async () => {
      try {
        const response = await fetch('/api/utility-types')
        if (response.ok) {
          const data = await response.json()
          setUtilityTypes(data.map((ut: any) => ut.name))
        }
      } catch (error) {
        console.error('Error fetching utility types:', error)
      }
    }
    
    fetchUtilityTypes()
  }, [utilityRefreshTrigger])

  const handleExpenseAdded = (newExpense?: any) => {
    if (newExpense) {
      setOptimisticExpense(newExpense)
      if (typeof newExpense.id === 'string' && !newExpense.id.startsWith('temp-')) {
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1)
          setOptimisticExpense(null)
        }, 100)
      }
    } else {
      setOptimisticExpense(null)
      setRefreshTrigger(prev => prev + 1)
    }
    
    setShowExpenseDialog(false)
  }

  const handleOptimisticExpenseConfirmed = () => {
    setOptimisticExpense(null)
  }

  const handleUtilityTypesChanged = () => {
    setUtilityRefreshTrigger(prev => prev + 1)
  }

  const menuTitles: Record<MenuId, string> = {
    dashboard: 'Dashboard',
    finance: 'Financial Overview',
    charts: 'Visual Analytics',
    loans: 'Loans Tracker',
    utilities: 'Manage Utilities',
    ai: 'AI Insights & Recommendations',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[oklch(0.13_0.02_250)] dark:via-[oklch(0.14_0.02_260)] dark:to-[oklch(0.15_0.02_270)] relative">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Sidebar Navigation */}
      <DashboardSidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        user={user}
        isMobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
      />

      {/* Main Content Workspace */}
      <div className={`transition-all duration-300 ${
        isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      } min-h-screen flex flex-col relative z-10`}>
        {/* Top Header Bar */}
        <header className="px-4 py-3.5 sm:px-8 border-b border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/40 dark:bg-[oklch(0.18_0.02_250)]/40 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden h-9 w-9 text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {menuTitles[activeMenu]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeMenu === 'dashboard' && (
              <Button
                onClick={() => setShowExpenseDialog(true)}
                className="hidden sm:flex bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md h-9.5 px-4 gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            )}
            
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <UserDropdown user={user} />
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <ExpenseList
            activeMenu={activeMenu}
            refreshTrigger={refreshTrigger}
            onOpenUtilities={() => setShowUtilityDialog(true)}
            optimisticExpense={optimisticExpense}
            onOptimisticExpenseConfirmed={handleOptimisticExpenseConfirmed}
            utilityTypeManagerNode={
              <div className="relative w-full pt-2">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 dark:from-green-600/10 dark:to-emerald-600/10 rounded-3xl blur-xl" />
                <UtilityTypeManager onUtilityTypesChanged={handleUtilityTypesChanged} />
              </div>
            }
          />
        </main>
      </div>

      {/* Floating Add Expense Button for Mobile on Dashboard view */}
      {activeMenu === 'dashboard' && (
        <div className="fixed bottom-5 right-5 z-40 sm:hidden">
          <Button
            onClick={() => setShowExpenseDialog(true)}
            size="lg"
            className="rounded-full h-14 w-14 shadow-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-0 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-transparent border-0 shadow-none p-0 [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <SmartExpenseInput 
            onExpenseAdded={handleExpenseAdded} 
            utilityRefreshTrigger={utilityRefreshTrigger}
            utilityTypes={utilityTypes} 
            onClose={() => setShowExpenseDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Utility Dialog */}
      <Dialog open={showUtilityDialog} onOpenChange={setShowUtilityDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-transparent border-0 shadow-none p-0 [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Manage Utility Types</DialogTitle>
          </DialogHeader>
          <UtilityTypeManager 
            onUtilityTypesChanged={() => {
              handleUtilityTypesChanged()
              setShowUtilityDialog(false)
            }}
            isInDialog={true}
            onClose={() => setShowUtilityDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}