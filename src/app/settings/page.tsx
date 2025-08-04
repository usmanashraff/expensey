'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, ArrowLeft, Save, User, Mail, LogOut, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { getCurrencyList } from '@/lib/currency'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const [defaultCurrency, setDefaultCurrency] = useState('PKR')
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{
    email?: string | null
    given_name?: string | null
    family_name?: string | null
    picture?: string | null
  } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchUserSettings()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFirstName(userData.given_name || '')
        setLastName(userData.family_name || '')
        setProfilePicture(userData.picture || '')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user-settings')
      if (response.ok) {
        const data = await response.json()
        if (data?.defaultCurrency) {
          setDefaultCurrency(data.defaultCurrency)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save user settings
      const settingsResponse = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultCurrency })
      })

      // Save user profile
      const profileResponse = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          given_name: firstName,
          family_name: lastName,
          picture: profilePicture
        })
      })

      if (settingsResponse.ok && profileResponse.ok) {
        toast.success('Settings saved successfully!')
        // Update local user state
        setUser(prev => ({
          ...prev,
          given_name: firstName,
          family_name: lastName,
          picture: profilePicture
        }))
        // Refresh user data to ensure it's saved
        await fetchUserData()
      } else {
        const settingsError = !settingsResponse.ok ? await settingsResponse.text() : null
        const profileError = !profileResponse.ok ? await profileResponse.text() : null
        console.error('Save failed:', { settingsError, profileError })
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfilePicture(data.picture)
        toast.success('Profile picture updated!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload profile picture')
      }
    } catch (error) {
      toast.error('Failed to upload profile picture')
      console.error('Error uploading avatar:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const userInitials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Profile Card */}
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20 dark:border-gray-700/50 shadow-xl">
            <CardHeader className="pb-6 space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Profile
                </CardTitle>
              </div>
              <CardDescription>
                Your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="relative">
                  {profileLoading ? (
                    <Skeleton className="h-24 w-24 rounded-full" />
                  ) : (
                    <>
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={profilePicture || undefined} 
                          alt={`${firstName} ${lastName}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg sm:text-2xl">{userInitials}</AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-0 right-0 rounded-full p-2 h-8 w-8"
                          disabled={uploadingAvatar}
                          asChild
                        >
                          <span className="cursor-pointer">
                            <Camera className="h-4 w-4" />
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Profile Form */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {profileLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        className="backdrop-blur-sm bg-white/50 dark:bg-white/5"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {profileLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        className="backdrop-blur-sm bg-white/50 dark:bg-white/5"
                      />
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {profileLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="backdrop-blur-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20 dark:border-gray-700/50 shadow-xl">
            <CardHeader className="pb-6 space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </CardTitle>
              </div>
              <CardDescription>
                Manage your application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-3"
              >
                <Label htmlFor="defaultCurrency" className="text-base font-medium">
                  Default Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  This currency will be pre-selected when creating new expenses and budgets
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-full md:w-[300px]" />
                ) : (
                  <Select 
                    value={defaultCurrency} 
                    onValueChange={setDefaultCurrency}
                    disabled={loading}
                  >
                    <SelectTrigger 
                      id="defaultCurrency" 
                      className="w-full md:w-[300px] backdrop-blur-sm bg-white/50 dark:bg-white/5"
                    >
                      <SelectValue placeholder="Select default currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrencyList().map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg">{curr.symbol}</span>
                            <span>{curr.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </motion.div>

            </CardContent>
          </Card>

          {/* Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-between"
          >
            <Button 
              onClick={handleSave}
              disabled={loading || profileLoading || saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Save className="h-4 w-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </>
              )}
            </Button>

            <LogoutLink>
              <Button variant="destructive" className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </LogoutLink>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}