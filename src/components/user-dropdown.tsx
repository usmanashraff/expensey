'use client'

import { useState } from 'react'
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
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { LogOut, User, ChevronDown } from 'lucide-react'

interface UserDropdownProps {
  user: {
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  }
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  
  const userInitials = `${user.given_name?.charAt(0) || ''}${user.family_name?.charAt(0) || ''}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
  const userName = user.given_name && user.family_name 
    ? `${user.given_name} ${user.family_name}` 
    : user.given_name || user.email || 'User'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 px-2 gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.picture || undefined} alt={userName} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium">{userName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutLink className="w-full">
            <div className="flex items-center gap-2 text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Log out</span>
            </div>
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}