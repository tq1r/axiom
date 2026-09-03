'use client'

import { useEffect } from 'react'
import { useNav } from '@/lib/axiom/store'
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

export function AxiomApp() {
  const { view } = useNav()

  // Keyboard shortcut: Cmd+J for new chat, Cmd+B for sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        // The chat app's store will handle this
        const nav = useNav.getState()
        if (nav.view === 'chat') {
          // Already in chat — the sidebar has a new chat button
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
      {view === 'dashboard' && <Dashboard />}
      {view === 'chat' && <ChatApp />}
      {view === 'studio' && <StudioApp />}
      {view === 'models' && <ModelsPage />}
      {view === 'pricing' && <PricingPage />}
      {view === 'settings' && <SettingsPage />}
      <CommandPalette />
      <KeyboardShortcuts />
    </>
  )
}
