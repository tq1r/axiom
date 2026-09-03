'use client'

import { useEffect, useState } from 'react'
import { useNav, useUser } from '@/lib/axiom/store'
import { LandingPage } from './landing/landing-page'
import { AuthPage } from './auth/auth-page'
import { Dashboard } from './app/dashboard'
import { ChatApp } from './chat/chat-app'
import { StudioApp } from './studio/studio-app'
import { ModelsPage } from './models/models-page'
import { PricingPage } from './pricing/pricing-page'
import { SettingsPage } from './settings/settings-page'
import { CommandPalette } from './shared/command-palette'
import { KeyboardShortcuts } from './shared/keyboard-shortcuts'

// Views that require authentication
const PROTECTED_VIEWS = new Set(['dashboard', 'chat', 'studio', 'settings'])

export function AxiomApp() {
  const { view, navigate } = useNav()
  const { user } = useUser()
  const [hydrated, setHydrated] = useState(false)

  // Wait for Zustand persist to hydrate from localStorage before doing anything.
  // This prevents the auth gate from firing on page load when user is briefly null.
  useEffect(() => {
    // Zustand persist hydrates synchronously on first render for localStorage,
    // but to be safe we wait one tick to ensure the store has settled.
    const t = setTimeout(() => setHydrated(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Auth gate: only fire AFTER hydration, so we don't redirect on page load
  useEffect(() => {
    if (!hydrated) return
    if (PROTECTED_VIEWS.has(view) && !user) {
      navigate('auth')
    }
  }, [view, user, navigate, hydrated])

  // Keyboard shortcut: Cmd+J for new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        const nav = useNav.getState()
        if (!useUser.getState().user) {
          nav.navigate('auth')
        } else {
          nav.navigate('chat')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // While waiting for hydration, render a neutral state to avoid flashing auth
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tangerine)]">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M5 27L16 4L27 27" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M10.5 20.5L21.5 20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="30" r="1.2" fill="white" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <>
      {view === 'landing' && <LandingPage />}
      {view === 'auth' && <AuthPage />}
      {view === 'dashboard' && user && <Dashboard />}
      {view === 'chat' && user && <ChatApp />}
      {view === 'studio' && user && <StudioApp />}
      {view === 'models' && <ModelsPage />}
      {view === 'pricing' && <PricingPage />}
      {view === 'settings' && user && <SettingsPage />}
      <CommandPalette />
      <KeyboardShortcuts />
    </>
  )
}
