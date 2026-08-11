'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PanelLeftClose, PanelLeft } from 'lucide-react'
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

  const menuItems: { id: MenuId; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'finance', label: 'Finance', icon: 'payments' },
    { id: 'charts', label: 'Charts', icon: 'monitoring' },
    { id: 'loans', label: 'Loans', icon: 'account_balance' },
    { id: 'utilities', label: 'Manage Utilities', icon: 'settings_applications' },
    { id: 'ai', label: 'AI Insights', icon: 'psychology', badge: 'AI' },
  ]

  const userName = user?.given_name
    ? `${user.given_name} ${user.family_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User'

  const sidebarContent = (isCollapsedMode = false) => (
    <div className={`flex flex-col h-full ${isCollapsedMode ? 'py-8 px-2' : 'py-8 px-6'} z-20 relative`}>

      {/* Toggle buttons - positioned absolutely on the container to not disrupt layout */}
      {!isCollapsedMode ? (
        <div className="absolute right-4 top-8 flex items-center gap-1 z-30">
          {onToggleDesktopCollapse && (
            <button
              onClick={onToggleDesktopCollapse}
              className="hidden lg:flex p-1 text-on-surface-variant hover:text-on-surface bg-surface/50 rounded-full transition-colors"
              title="Collapse Sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu_open</span>
            </button>
          )}
          <button
            onClick={() => onMobileOpenChange(false)}
            className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface bg-surface/50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      ) : (
        <div className="absolute right-0 top-8 w-full flex justify-center z-30">
          <button
            onClick={onToggleDesktopCollapse}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            title="Expand Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        </div>
      )}

      {/* Brand Header */}
      <div className={`mb-12 flex items-center ${isCollapsedMode ? 'justify-center flex-col gap-4 mt-12' : 'gap-3'} relative`}>
        <span
          className="material-symbols-outlined text-4xl text-on-surface-variant"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          account_balance
        </span>

        {!isCollapsedMode && (
          <div className="pr-8">
            <h1 className="font-serif-heading text-[24px] text-on-surface tracking-tight leading-none font-medium">Expensey</h1>
          </div>
        )}
      </div>

      {/* Menu Items List */}
      <ul className="flex flex-col gap-2 flex-grow">
        {menuItems.map((item) => {
          const isActive = activeMenu === item.id

          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  onSelectMenu(item.id)
                  onMobileOpenChange(false)
                }}
                title={isCollapsedMode ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsedMode ? 'justify-center px-2 py-3' : 'gap-4 px-4 py-3'
                  } rounded-[16px] transition-all duration-200 ${isActive
                    ? 'text-on-surface font-semibold border-r-4 border-tertiary bg-surface-container opacity-90'
                    : 'text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-low'
                  }`}
              >
                <span className={`material-symbols-outlined ${isCollapsedMode ? 'text-2xl' : ''}`}>
                  {item.icon}
                </span>

                {!isCollapsedMode && (
                  <>
                    <span className="font-sans text-sm flex-grow text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#212529] dark:bg-[#f6fafe] text-white dark:text-[#14171a] text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Footer User Section */}
      <div className="mt-auto pt-6 border-t border-outline-variant/50">
        {!isCollapsedMode ? (
          <>
            <div className="flex items-center justify-between px-2 text-on-surface-variant font-sans text-xs font-semibold uppercase mb-4">
              <span>PREFERENCES</span>
              <ThemeToggle />
            </div>

            <div className="px-2 w-full">
              <UserDropdown user={user} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-1">
            <ThemeToggle isCollapsed={true} />
            <div className="w-full">
              <UserDropdown user={user} isCollapsed={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar (Docked) */}
      <aside className={`hidden lg:block fixed top-0 left-0 bottom-0 z-40 bg-surface text-on-surface border-r border-outline-variant transition-all duration-300 ${isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}>
        {sidebarContent(isDesktopCollapsed)}
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
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide-over Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-surface text-on-surface border-r border-outline-variant shadow-xl transform-gpu will-change-transform"
            >
              {sidebarContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
