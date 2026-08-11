'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Welcome back!')
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="w-full max-w-[440px]"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <span className="font-display-lg text-[24px] font-bold text-on-surface tracking-tight">Expensey</span>
          </Link>
          <h1 className="font-display-lg text-[32px] font-bold text-on-surface mb-2 leading-tight">
            Welcome Back
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Sign in to access your ledger
          </p>
        </div>

        <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-6 border-b border-outline-variant/30 bg-surface/50 text-center">
            <CardTitle className="font-headline-md text-xl font-bold text-on-surface">Secure Sign In</CardTitle>
            <CardDescription className="text-on-surface-variant">Enter your credentials below</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-on-surface font-semibold">Email Address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-surface border-outline-variant focus:border-tertiary focus:ring-tertiary/20 text-on-surface h-12 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-on-surface font-semibold">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-surface border-outline-variant focus:border-tertiary focus:ring-tertiary/20 text-on-surface h-12 rounded-lg pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-sm mt-0.5">error</span>
                  <p className="text-sm text-[#ba1a1a] font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
            
            <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link href="/register" className="text-tertiary hover:text-tertiary/80 font-semibold transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
