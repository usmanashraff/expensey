'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Github, Linkedin, Mail, ArrowLeft, Code, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutDeveloper() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[oklch(0.13_0.02_250)] dark:via-[oklch(0.14_0.02_260)] dark:to-[oklch(0.15_0.02_270)] overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-16"
        >
          <Link href="/" className="hidden sm:block hover:opacity-80 transition-opacity">
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
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
          </div>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
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
            className="inline-block mb-6"
          >
            <Sparkles className="w-12 h-12 text-yellow-500/40 mx-auto" />
          </motion.div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            Meet the{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Developer
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Passionate about creating beautiful and functional applications
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl blur-xl" />
          <Card className="relative p-8 md:p-12 backdrop-blur-lg border-white/20 dark:border-white/10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-2xl blur-2xl" />
                <Image
                  src="/developer.jpg"
                  alt="Developer"
                  width={400}
                  height={400}
                  className="rounded-2xl shadow-2xl relative z-10 w-full h-auto"
                  priority
                />
              </motion.div>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Full Stack Developer</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Specializing in creating modern web applications with cutting-edge technologies. 
                    Passionate about clean code, beautiful UI/UX, and solving complex problems.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-primary" />
                    <span>React, Next.js, TypeScript, Node.js</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>5+ Years of Experience</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span>Computer Science Graduate</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.a
                    href="https://github.com/usmanashraff"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button size="icon" variant="outline" className="rounded-full">
                      <Github className="h-5 w-5" />
                    </Button>
                  </motion.a>
                  <motion.a
                    href="https://www.linkedin.com/in/usman-ashraf-304145274/"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button size="icon" variant="outline" className="rounded-full">
                      <Linkedin className="h-5 w-5" />
                    </Button>
                  </motion.a>
                  <motion.a
                    href="mailto:osmanashruf@gmail.com"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button size="icon" variant="outline" className="rounded-full">
                      <Mail className="h-5 w-5" />
                    </Button>
                  </motion.a>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              title: "Projects Completed",
              value: "50",
              suffix: "+",
              icon: Briefcase,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/20 to-cyan-500/20",
              delay: 0.7
            },
            {
              title: "Happy Clients",
              value: "100",
              suffix: "+",
              icon: Sparkles,
              gradient: "from-purple-500 to-pink-500",
              bgGradient: "from-purple-500/20 to-pink-500/20",
              delay: 0.8
            },
            {
              title: "Years of Experience",
              value: "5",
              suffix: "+",
              icon: Code,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/20 to-emerald-500/20",
              delay: 0.9
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stat.delay }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgGradient} rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
              
              <Card className="relative h-full p-8 text-center backdrop-blur-xl bg-white/50 dark:bg-[oklch(0.2_0.02_250)]/40 border-white/20 dark:border-white/10 rounded-3xl overflow-hidden">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}
                  >
                    <stat.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: stat.delay + 0.2, type: "spring" }}
                    className="mb-2"
                  >
                    <span className={`text-3xl sm:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </span>
                    <span className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.suffix}
                    </span>
                  </motion.div>
                  
                  <p className="text-base font-medium text-muted-foreground">{stat.title}</p>
                </div>
                
                {/* Decorative elements */}
                <motion.div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-white/5"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-tr from-white/20 to-white/5 dark:from-white/10 dark:to-white/5"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            Let's Build Something{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Amazing Together
            </span>
          </h3>
          <motion.a
            href="mailto:osmanashruf@gmail.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button size="lg" className="gap-2">
              Get In Touch <Mail className="h-4 w-4" />
            </Button>
          </motion.a>
        </motion.div>
      </div>
    </div>
  )
}