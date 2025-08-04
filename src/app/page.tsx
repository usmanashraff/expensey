'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { ArrowRight, TrendingUp, Shield, PieChart, Sparkles, Zap, BarChart3, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Check authentication status
    fetch('/api/check-auth')
      .then(res => res.json())
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[oklch(0.13_0.02_250)] dark:via-[oklch(0.14_0.02_260)] dark:to-[oklch(0.15_0.02_270)] overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full filter blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x * 0.05}px`,
            top: `${mousePosition.y * 0.05}px`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-2 relative z-10">
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-16"
        >
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="Expensey Logo" 
              width={80} 
              height={20}
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about">
              <Button variant="ghost" size="sm">About Developer</Button>
            </Link>
            <ThemeToggle />
            {authenticated ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <LoginLink>
                  <Button variant="ghost" size="sm">Login</Button>
                </LoginLink>
                <RegisterLink>
                  <Button size="sm">Get Started</Button>
                </RegisterLink>
              </>
            )}
          </div>
        </motion.nav>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center max-w-4xl mx-auto mt-20 relative"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -top-10 left-1/2 -translate-x-1/2"
          >
            <Sparkles className="w-8 h-8 text-yellow-500/40" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 relative">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Take Control of Your{' '}
            </motion.span>
            <motion.span 
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Finances
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
            </motion.span>
          </h1>
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Track expenses, monitor savings, and achieve your financial goals with our intuitive expense tracking platform.
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {authenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <RegisterLink>
                  <Button size="lg" className="gap-2">
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </RegisterLink>
                <LoginLink>
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </LoginLink>
              </>
            )}
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto md:items-stretch">
          {[
            {
              icon: TrendingUp,
              title: "Track Expenses",
              description: "Categorize and monitor your spending habits with detailed insights.",
              color: "blue",
              delay: 1
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description: "Your financial data is encrypted and protected with enterprise-grade security.",
              color: "purple",
              delay: 1.2
            },
            {
              icon: PieChart,
              title: "Visual Analytics",
              description: "Beautiful charts and graphs to visualize your financial journey.",
              color: "green",
              delay: 1.4
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group flex"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative text-center p-8 rounded-3xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/30 backdrop-blur-lg border border-white/20 dark:border-white/10 shadow-xl flex-1 flex flex-col">
                <motion.div 
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 mb-4 relative`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className={`h-8 w-8 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                  <div className={`absolute inset-0 rounded-2xl bg-${feature.color}-400/20 blur-lg`} />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground flex-1">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional premium features section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-32 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Expensey
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Real-time updates" },
              { icon: BarChart3, title: "Smart Insights", desc: "AI-powered analytics" },
              { icon: Sparkles, title: "Beautiful UI", desc: "Premium experience" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.8 + i * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 backdrop-blur-lg border border-white/20 dark:border-white/10"
              >
                <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* About Developer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="mt-20 text-center pb-8"
        >
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
            About the Developer →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}