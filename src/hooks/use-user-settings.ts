import { useState, useEffect } from 'react'

interface UserSettings {
  defaultCurrency: string
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({ defaultCurrency: 'PKR' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserSettings()
  }, [])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          defaultCurrency: data?.defaultCurrency || 'PKR'
        })
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading }
}