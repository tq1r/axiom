'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, User, Github, Chrome, Sparkles, ArrowRight, Check } from 'lucide-react'
import { AxiomLogo } from '../shared/logo'
import { ThemeToggle } from '../shared/theme-toggle'
import { useNav, useUser } from '@/lib/axiom/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AuthPage() {
  const { authMode, setAuthMode, navigate, setAuth } = useNav()
  const { signIn } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const isSignUp = authMode === 'signup'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const finalName = isSignUp ? (name || email.split('@')[0] || 'New User') : 'Alex Rivera'
      const finalEmail = email || 'alex@axiom.dev'
      signIn(finalName, finalEmail)
      setAuth(true)
      setLoading(false)
      navigate('dashboard')
    }, 800)
  }

  const handleOAuth = (provider: string) => {
    setLoading(true)
    setTimeout(() => {
      signIn(`${provider} User`, `${provider.toLowerCase()}@axiom.dev`)
      setAuth(true)
      setLoading(false)
      navigate('dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 axiom-grid-bg opacity-40" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/20 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <div className="max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 mb-8 axiom-glow-sm">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-4xl font-semibold tracking-tight leading-tight">
              One account.
              <br />
              <span className="axiom-gradient-text">Two flagship products.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Sign in to access Axiom Chat and Axiom Studio with a single identity.
              Your threads, projects, and usage sync across both.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Stream chats in real time with sub-300ms first token',
                'Build full apps with an AI agent in Studio',
                'Branch, share, and export every conversation',
                'Index your codebase for repo-wide Q&A',
              ].map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 mt-0.5">
                    <Check className="h-3 w-3 text-accent" />
                  </div>
                  <span className="text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {['from-indigo-500 to-violet-500', 'from-cyan-400 to-teal-500', 'from-pink-500 to-rose-500', 'from-emerald-400 to-green-500'].map((g, i) => (
                <div key={i} className={cn('h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br', g)} />
              ))}
            </div>
            <span>Joined by 10,000+ builders this month</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <button onClick={() => navigate('landing')}>
            <AxiomLogo size={28} />
          </button>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-semibold tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp
                ? 'Start building with Axiom in under a minute.'
                : 'Sign in to continue to Axiom.'}
            </p>

            <div className="mt-8 space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 border-border bg-background/50"
                onClick={() => handleOAuth('Google')}
                disabled={loading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-border bg-background/50"
                onClick={() => handleOAuth('GitHub')}
                disabled={loading}
              >
                <Github className="h-4 w-4 mr-2" />
                Continue with GitHub
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 bg-background/50"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs text-accent hover:underline">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-background/50"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-foreground text-background hover:bg-foreground/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background axiom-spin" />
                    Please wait…
                  </span>
                ) : (
                  <>
                    {isSignUp ? 'Create account' : 'Sign in'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setAuthMode(isSignUp ? 'signin' : 'signup')}
                className="text-accent hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            {isSignUp && (
              <p className="mt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
                By creating an account, you agree to Axiom's{' '}
                <a href="#" className="underline hover:text-foreground">Terms</a> and{' '}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
