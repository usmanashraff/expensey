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
          <Button variant="ghost" className="relative h-10 w-auto sm:w-full px-1.5 sm:px-2 justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage 
                  src={user.picture || undefined} 
                  alt={userName}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block text-sm font-medium truncate">{userName}</span>
            </div>
            <ChevronDown className="hidden sm:inline-block h-4 w-4 opacity-50 shrink-0" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="w-full">
            <div className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <div className="flex items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Log out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}