'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HeroShader } from '@/components/hero-shader'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Check authentication status
    fetch('/api/check-auth')
      .then(res => res.json())
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/50 h-20 transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`}
        id="mainNav"
      >
        <div className="max-w-[1280px] mx-auto px-6 h-full flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight text-[24px] leading-none">Expensey</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" href="#features">Features</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" href="#insights">AI Insights</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" href="#testimonials">Clients</a>
            <Link href="/about" className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Developer</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {authenticated ? (
              <Link href="/dashboard">
                <button className="bg-[#212529] dark:bg-[#f6fafe] dark:text-[#14171a] text-white font-label-md text-label-md px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all">Dashboard</button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2">Log In</button>
                </Link>
                <Link href="/register">
                  <button className="bg-[#212529] dark:bg-[#f6fafe] dark:text-[#14171a] text-white font-label-md text-label-md px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all">Get Started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 w-full h-full -z-10 opacity-40 dark:opacity-10">
          <HeroShader />
        </div>
        
        <div className="max-w-[1280px] mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="pr-0 md:pr-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/50 mb-6">
              <span className="material-symbols-outlined text-sm text-tertiary">psychology</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Smart Personal Finance</span>
            </div>
            <h1 className="font-display-lg text-[48px] sm:text-[56px] text-on-surface mb-6 leading-[1.1] font-bold tracking-tight">
              Take Control of <br/>
              <span className="text-tertiary">Your Finances</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg">
              Track expenses, monitor budgets, and achieve financial clarity with our intuitive, AI-powered expense tracking platform designed for modern professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={authenticated ? "/dashboard" : "/register"}>
                <button className="w-full sm:w-auto bg-[#212529] dark:bg-[#f6fafe] dark:text-[#14171a] text-white font-label-md text-label-md px-8 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 group">
                  {authenticated ? "Open Dashboard" : "Get Started"}
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </Link>
              {!authenticated && (
                <Link href="/login">
                  <button className="w-full sm:w-auto border border-outline-variant text-on-surface font-label-md text-label-md px-8 py-4 rounded-full hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                    View Demo
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="relative h-[500px] mt-12 rounded-xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-outline-variant/30 hidden md:block"
          >
            <img 
              alt="Professional workspace" 
              className="object-cover w-full h-full" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrTxBNRe_bNjlT8Ku2WpNjEt0CBwT7d9M91mBYBNNHH2Ke6YRUsFHhXdbISe5IKN_cmZWQXs20K44WeibxJA1cyHLbgPigiOMOQbjpgCClgOcr92VZ0_8hVoUqB16trbgHOQXTe3HIhYzt0S98qeVoTC76fnmvF_1JqFTftM58Ge218uzwy_hKUgltZ7butUKtr0C4lPEl777dtjQ02oItzC1jiL8puR3oF7Pi5k5hbQqC4U8qPPm7-A"
            />
            {/* Floating Glass Card */}
            <div className="absolute bottom-8 left-8 right-8 glass-panel rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Portfolio Value</p>
                <p className="font-headline-md text-headline-md text-on-surface">$2.4M</p>
              </div>
              <div className="h-12 w-24 relative">
                {/* Simulated Sparkline */}
                <svg className="w-full h-full stroke-tertiary fill-none" strokeLinecap="round" strokeWidth="2" viewBox="0 0 100 40">
                  <path d="M0,30 Q20,35 40,20 T80,15 T100,5"></path>
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-surface-container-lowest" id="features">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Track */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
              className="p-8 rounded-xl bg-surface border border-outline-variant hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-surface fill-icon">monitoring</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Smart Logging</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Log expenses instantly using our advanced AI natural language input, or use the robust manual entry forms to record every detail.
              </p>
            </motion.div>
            
            {/* Analyze */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.1 }}}}
              className="p-8 rounded-xl bg-surface border border-outline-variant hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-tertiary fill-icon">query_stats</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Visual Analytics</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Understand your spending instantly with beautiful charts and visual breakdowns separating your Needs, Wants, and Savings goals.
              </p>
            </motion.div>
            
            {/* Optimize */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.2 }}}}
              className="p-8 rounded-xl bg-surface border border-outline-variant hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-secondary-container fill-icon">tune</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Budget Control</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Set strict monthly limits by category. Our real-time trackers ensure you always know exactly how much you have left before you overspend.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Detailed Features (Bento Grid) */}
      <section className="py-24 bg-surface" id="insights">
        <div className="max-w-[1280px] mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-4">Precision Instrumentation</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Expensey replaces fragmented spreadsheets with a cohesive, beautifully engineered environment designed for decisive financial action.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[320px]">
            {/* AI Insights (Large Card) */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
              className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 relative overflow-hidden group hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] transition-all"
            >
              <div className="relative z-10 w-full md:w-2/3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container text-tertiary mb-4">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  <span className="font-label-sm text-label-sm">AI-Powered</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Natural Language AI</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Just type "Coffee at Starbucks for 500" and let our proprietary AI engine automatically parse the amount, description, and assign the correct category in seconds.
                </p>
                <a className="inline-flex items-center gap-2 font-label-md text-label-md text-tertiary hover:text-on-surface transition-colors cursor-pointer">
                  Explore Capabilities <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
              {/* Abstract decorative element */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors duration-700"></div>
            </motion.div>

            {/* Visual Analytics (Small Card) */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.1 }}}}
              className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col justify-between group hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] transition-all"
            >
              <div>
                <span className="material-symbols-outlined text-on-surface mb-4 text-3xl">receipt_long</span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-[20px]">Smart Receipts</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  Upload and securely store receipts alongside every transaction.
                </p>
              </div>
              {/* Mini chart representation */}
              <div className="w-full h-24 flex items-end gap-2 mt-4 opacity-70">
                <div className="w-full bg-surface-variant rounded-t-sm h-[40%] group-hover:h-[50%] transition-all duration-500"></div>
                <div className="w-full bg-surface-variant rounded-t-sm h-[60%] group-hover:h-[70%] transition-all duration-500 delay-75"></div>
                <div className="w-full bg-tertiary rounded-t-sm h-[85%] group-hover:h-[95%] transition-all duration-500 delay-150"></div>
                <div className="w-full bg-surface-variant rounded-t-sm h-[30%] group-hover:h-[40%] transition-all duration-500 delay-200"></div>
              </div>
            </motion.div>

            {/* Loan Management */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.2 }}}}
              className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col md:flex-row items-center gap-12 group hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] transition-all"
            >
              <div className="w-full md:w-1/2">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Loans & Utilities Manager</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Centralize your recurring utility bills to never miss a due date. Track every personal loan, recording exactly who owes you money or who you owe, ensuring a perfectly balanced ledger.
                </p>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Total Tracked</span>
                    <span className="font-headline-md text-[20px] font-bold text-on-surface">$1,450</span>
                  </div>
                  <div className="w-[1px] bg-outline-variant self-stretch"></div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Active Loans</span>
                    <span className="font-headline-md text-[20px] font-bold text-on-surface">3</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 h-full min-h-[200px] bg-surface-container rounded-lg border border-outline-variant/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                {/* Abstract UI representation */}
                <div className="w-3/4 h-24 bg-white/80 dark:bg-[#14171a]/80 backdrop-blur-sm border border-outline-variant rounded-md shadow-sm p-4 relative z-10 flex flex-col justify-between">
                  <div className="w-1/3 h-2 bg-surface-variant rounded-full"></div>
                  <div className="w-full h-8 bg-surface-variant rounded-sm flex overflow-hidden">
                    <div className="w-[30%] h-full bg-tertiary"></div>
                    <div className="w-[70%] h-full bg-surface-container-high"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof / Human Touch */}
      <section className="py-32 bg-surface-container-lowest" id="testimonials">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.span 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="material-symbols-outlined text-4xl text-tertiary mb-8 fill-icon"
          >
            format_quote
          </motion.span>
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.1 }}}}
            className="font-headline-lg font-bold text-on-surface leading-tight mb-8 text-[28px] sm:text-[36px]"
          >
            "Expensey brought incredible clarity to my personal finances. The AI natural language input feels like magic, making logging expenses completely frictionless."
          </motion.h2>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.2 }}}}
          >
            <p className="font-label-md text-label-md text-on-surface">Eleanor Vance</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Managing Director, Vanguard Partners</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-surface border-t border-outline-variant">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariant}
          className="max-w-[1280px] mx-auto px-6 text-center"
        >
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-6">Begin Your Ledger</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto mb-10">
            Join thousands of disciplined professionals managing their wealth with unparalleled clarity and precision.
          </p>
          <Link href="/register">
            <button className="bg-[#212529] dark:bg-[#f6fafe] dark:text-[#14171a] text-white font-label-md text-label-md px-10 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-sm">
              Create Account
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-12 border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">account_balance</span>
            <span className="font-label-md text-label-md text-on-surface-variant">Expensey &copy; 2024</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/usmanashraff" target="_blank" rel="noopener noreferrer" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">GitHub</a>
            <a href="https://www.linkedin.com/in/usman-ashraf-304145274/" target="_blank" rel="noopener noreferrer" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">LinkedIn</a>
            <a href="https://usman-codes.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">Portfolio</a>
          </div>
        </div>
      </footer>
    </div>
  )
}