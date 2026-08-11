'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getCurrencyList } from '@/lib/currency'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const router = useRouter()
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
      const settingsResponse = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultCurrency })
      })

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
        setUser(prev => ({
          ...prev,
          given_name: firstName,
          family_name: lastName,
          picture: profilePicture
        }))
        await fetchUserData()
      } else {
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
    } finally {
      setUploadingAvatar(false)
    }
  }

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
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* We make this a standalone full page since layout doesn't wrap it */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 md:px-16 pt-16 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="mb-10 flex items-center gap-4"
        >
          <Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="font-display-lg text-[28px] md:text-[32px] text-on-surface tracking-tight font-semibold">Settings</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const, delay: 0.1 }}
          className="flex flex-col gap-8"
        >
          {/* Profile Section */}
          <section className="bg-white dark:bg-[#1c2024] border border-outline-variant/50 shadow-sm rounded-xl p-8 md:p-10 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <h3 className="font-serif-heading text-[24px] font-medium text-on-surface leading-tight">Profile</h3>
                <p className="font-sans text-sm text-on-surface-variant mt-1">Your personal information</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="relative group/avatar cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container ring-1 ring-outline-variant shadow-sm relative bg-surface-container flex items-center justify-center">
                  {profilePicture ? (
                    <img 
                      className="w-full h-full object-cover" 
                      src={profilePicture} 
                      alt="Profile"
                    />
                  ) : (
                    <span className="text-4xl text-on-surface-variant font-medium">
                      {(firstName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </label>
                </div>
                {uploadingAvatar && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-container-high px-3 py-1 rounded-full text-xs shadow-sm border border-outline-variant">
                    Uploading...
                  </div>
                )}
              </div>

              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-semibold tracking-wide text-on-surface-variant">First Name</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-sans text-base text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors outline-none hover:border-outline" 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-semibold tracking-wide text-on-surface-variant">Last Name</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-sans text-base text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors outline-none hover:border-outline" 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-sans text-sm font-semibold tracking-wide text-on-surface-variant">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                    <input 
                      className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 py-3 font-sans text-base text-on-surface-variant cursor-not-allowed opacity-70 outline-none" 
                      disabled 
                      type="email" 
                      value={user?.email || ''}
                    />
                  </div>
                  <span className="font-sans text-xs text-on-surface-variant mt-1">Email cannot be changed</span>
                </div>
              </div>
            </div>
          </section>

          {/* Settings Section */}
          <section className="bg-white dark:bg-[#1c2024] border border-outline-variant/50 shadow-sm rounded-xl p-8 md:p-10 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
              </div>
              <div>
                <h3 className="font-serif-heading text-[24px] font-medium text-on-surface leading-tight">Preferences</h3>
                <p className="font-sans text-sm text-on-surface-variant mt-1">Manage your application settings</p>
              </div>
            </div>
            
            <div className="max-w-xl">
              <h4 className="font-sans text-base text-on-surface mb-1 font-semibold">Default Currency</h4>
              <p className="font-sans text-sm text-on-surface-variant mb-4">This currency will be pre-selected when creating new expenses.</p>
              
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-xl pl-12 pr-12 py-3 font-sans text-base text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors outline-none hover:border-outline cursor-pointer"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                  {getCurrencyList().map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.value} - {curr.label}
                    </option>
                  ))}
                </select>
                <span className="font-mono text-base text-on-surface font-semibold absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {getCurrencyList().find(c => c.value === defaultCurrency)?.symbol || '$'}
                </span>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
          </section>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const, delay: 0.2 }}
          className="mt-12 flex flex-col-reverse md:flex-row justify-between items-center gap-6 border-t border-outline-variant/50 pt-8"
        >
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-3 rounded-full bg-[#ba1a1a]/10 dark:bg-[#93000a]/20 text-[#ba1a1a] dark:text-[#ffb4ab] font-sans text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#ba1a1a]/20 dark:hover:bg-[#93000a]/40 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Log Out
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 rounded-full bg-[#212529] hover:bg-[#343a40] text-white dark:bg-[#f6fafe] dark:text-[#14171a] dark:hover:bg-[#e4e4cc] font-sans text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">save</span>
            )}
            Save All Changes
          </button>
        </motion.div>
      </main>
    </div>
  )
}