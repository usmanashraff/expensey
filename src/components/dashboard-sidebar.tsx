'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, DollarSign, BarChart3, HandCoins, Settings, 
  Brain, Sparkles, X, ChevronRight, PanelLeftClose, PanelLeft
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserDropdown } from '@/components/user-dropdown'
import { Button } from '@/components/ui/button'

export type MenuId = 'dashboard' | 'finance' | 'charts' | 'loans' | 'utilities' | 'ai'

interface DashboardSidebarProps {
  activeMenu: MenuId
  onSelectMenu: (menu: MenuId) => void
  user: {
    id: string
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  }
  isMobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  isDesktopCollapsed?: boolean
  onToggleDesktopCollapse?: () => void
}

export function DashboardSidebar({
  activeMenu,
  onSelectMenu,
  user,
  isMobileOpen,
  onMobileOpenChange,
  isDesktopCollapsed = false,
  onToggleDesktopCollapse,
}: DashboardSidebarProps) {

  const menuItems: { id: MenuId; label: string; icon: React.ElementType; color: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'finance', label: 'Finance', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'charts', label: 'Charts', icon: BarChart3, color: 'text-cyan-600 dark:text-cyan-400' },
    { id: 'loans', label: 'Loans', icon: HandCoins, color: 'text-purple-600 dark:text-purple-400' },
    { id: 'utilities', label: 'Manage Utilities', icon: Settings, color: 'text-orange-600 dark:text-orange-400' },
    { id: 'ai', label: 'AI Insights', icon: Brain, color: 'text-pink-600 dark:text-pink-400', badge: 'AI' },
  ]

  const sidebarContent = (isCollapsedMode = false) => (
    <div className="flex flex-col h-full justify-between p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div>
        <div className={`flex items-center ${isCollapsedMode ? 'justify-center' : 'justify-between'} px-1 py-2 mb-4`}>
          {!isCollapsedMode ? (
            <>
              <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="Expensey Logo"
                  width={85}
                  height={22}
                  className="object-contain"
                  priority
                />
              </Link>
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ 
                    rotate: [0, 8, -8, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-500/60" />
                </motion.div>

                {/* Desktop Collapse Button */}
                {onToggleDesktopCollapse && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleDesktopCollapse}
                    className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                )}

                {/* Close button on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMobileOpenChange(false)}
                  className="lg:hidden h-8 w-8 text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDesktopCollapse}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
              title="Expand Sidebar"
            >
              <PanelLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </Button>
          )}
        </div>

        {/* Menu Items List */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectMenu(item.id)
                  onMobileOpenChange(false)
                }}
                title={isCollapsedMode ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsedMode ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } rounded-2xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-pink-500/25 text-foreground shadow-xs border border-purple-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`flex items-center ${isCollapsedMode ? 'justify-center' : 'gap-3'}`}>
                  <div className={`p-2 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-purple-500/15 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsedMode && <span>{item.label}</span>}
                </div>

                {!isCollapsedMode && (
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div layoutId="activeIndicator" transition={{ duration: 0.2 }}>
                        <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </motion.div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer User Section */}
      <div className="pt-3 border-t border-gray-200/50 dark:border-gray-800/50 space-y-3">
        {!isCollapsedMode ? (
          <>
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Preferences
              </span>
              <ThemeToggle />
            </div>

            <div className="p-2 rounded-2xl bg-white/40 dark:bg-white/5 border border-gray-200/40 dark:border-gray-800/40 backdrop-blur-sm flex items-center justify-between">
              <UserDropdown user={user} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            <ThemeToggle isCollapsed={true} />
            <UserDropdown user={user} isCollapsed={true} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden lg:block fixed top-0 left-0 bottom-0 z-40 p-3 transition-all duration-300 ${
        isDesktopCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="h-full rounded-3xl backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
          {sidebarContent(isDesktopCollapsed)}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onMobileOpenChange(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60"
            />

            {/* Slide-over Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 p-3 transform-gpu will-change-transform"
            >
              <div className="h-full rounded-3xl bg-white dark:bg-[oklch(0.18_0.02_250)] text-foreground border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
                {sidebarContent(false)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
