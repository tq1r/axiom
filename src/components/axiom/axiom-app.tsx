'use client'

import { useEffect } from 'react'
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

  // Auth gate: if trying to access a protected view without a user, redirect to auth
  useEffect(() => {
    if (PROTECTED_VIEWS.has(view) && !user) {
      navigate('auth')
    }
  }, [view, user, navigate])

  // Keyboard shortcut: Cmd+J for new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        const nav = useNav.getState()
        if (!nav.isAuthenticated && !useUser.getState().user) {
          nav.navigate('auth')
        } else {
          nav.navigate('chat')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
