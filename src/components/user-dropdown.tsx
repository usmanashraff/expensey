'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, ChevronDown, Settings } from 'lucide-react'
import Link from 'next/link'

interface UserDropdownProps {
  user: {
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  }
  isCollapsed?: boolean
}

export function UserDropdown({ user, isCollapsed = false }: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  
  const userInitials = `${user.given_name?.charAt(0) || ''}${user.family_name?.charAt(0) || ''}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
  const userName = user.given_name && user.family_name 
    ? `${user.given_name} ${user.family_name}` 
    : user.given_name || user.email || 'User'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {isCollapsed ? (
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user.picture || undefined} 
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button variant="ghost" className="relative h-10 w-full px-2 justify-between gap-2 hover:bg-surface-container rounded-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage 
                  src={user.picture || undefined} 
                  alt={userName}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-[#eaeef2] text-[#171c1f] dark:bg-[#24282c] dark:text-[#f6fafe]">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-on-surface truncate text-left">{userName}</span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#5b5f63] shrink-0">expand_more</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-1" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="font-sans text-sm font-semibold text-on-surface leading-none">{userName}</p>
            <p className="font-sans text-xs leading-none text-on-surface-variant mt-1">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#c4c7c8]/50 dark:bg-[#353a40] mx-1" />
        <DropdownMenuItem asChild className="focus:bg-[#eaeef2] dark:focus:bg-[#24282c] cursor-pointer rounded-lg mx-1 my-1">
          <Link href="/settings" className="w-full">
            <div className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors py-1">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="font-sans text-sm font-medium">Settings</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#c4c7c8]/50 dark:bg-[#353a40] mx-1" />
        <DropdownMenuItem onClick={handleLogout} className="focus:bg-[#ffdad6]/50 dark:focus:bg-[#93000a]/20 cursor-pointer rounded-lg mx-1 my-1">
          <div className="flex items-center gap-3 text-[#ba1a1a] transition-colors py-1">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-sans text-sm font-medium">Log out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}