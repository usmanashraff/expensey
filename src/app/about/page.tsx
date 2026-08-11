'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Github, Linkedin, Mail, ArrowLeft, Code, Briefcase, GraduationCap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutDeveloper() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/50 h-20 transition-all duration-300">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight text-[24px] leading-none">Expensey</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/">
              <button className="border border-outline-variant text-on-surface font-label-md text-label-md px-6 py-2.5 rounded-full hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Return to Ledger
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6 pt-32 pb-24 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariant}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/50 mb-6">
            <span className="material-symbols-outlined text-sm text-tertiary">code</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Architect</span>
          </div>
          <h1 className="font-display-lg text-[40px] sm:text-[48px] font-bold text-on-surface mb-6 leading-[1.1]">
            Engineering the <br />
            <span className="text-tertiary">Future of Finance</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
            A disciplined approach to software development, focusing on robust architectures, type-safe environments, and editorial-grade user interfaces.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ ...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.1 } } }}
          className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-12 mb-16 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)]"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-tertiary/5 rounded-2xl blur-xl group-hover:bg-tertiary/10 transition-colors duration-700" />
              <div className="relative rounded-2xl overflow-hidden border border-outline-variant/50">
                <Image
                  src="/developer.jpg"
                  alt="Developer Profile"
                  width={400}
                  height={400}
                  className="w-full h-auto object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                  priority
                />
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-3">Principal Systems Engineer</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Specializing in creating modern web applications with cutting-edge technologies.
                  Passionate about clean code, scalable architecture, and translating complex financial data into intuitive experiences.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <Code className="h-5 w-5 text-tertiary" />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">React, Next.js, TypeScript, Node.js</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-tertiary" />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">5+ Years Architectural Experience</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-tertiary" />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">Computer Science Graduate</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
                <a
                  href="https://github.com/usmanashraff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/usman-ashraf-304145274/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="mailto:osmanashruf@gmail.com"
                  className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ ...fadeUpVariant, visible: { ...fadeUpVariant.visible, transition: { ...fadeUpVariant.visible.transition, delay: 0.2 } } }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            {
              title: "Projects Completed",
              value: "50",
              suffix: "+",
              icon: "inventory_2"
            },
            {
              title: "Happy Clients",
              value: "100",
              suffix: "+",
              icon: "handshake"
            },
            {
              title: "Years of Experience",
              value: "5",
              suffix: "+",
              icon: "history"
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-surface border border-outline-variant text-center group hover:border-tertiary transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-6 group-hover:bg-tertiary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-tertiary">{stat.icon}</span>
              </div>
              <h3 className="font-display-lg text-[32px] font-bold text-on-surface mb-2">
                {stat.value}<span className="text-tertiary">{stat.suffix}</span>
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {stat.title}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-8 border-t border-outline-variant mt-20">
        <div className="max-w-[1280px] mx-auto px-6 flex justify-center items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Built with precision. 2024</span>
        </div>
      </footer>
    </div>
  )
}