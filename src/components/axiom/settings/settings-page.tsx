'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Palette,
  CreditCard,
  Key,
  Shield,
  Database,
  Bell,
  LogOut,
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Download,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { useNav, useUser } from '@/lib/axiom/store'
import { ThemeToggle } from '../shared/theme-toggle'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API keys', icon: Key },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
] as const

export function SettingsPage() {
  const { activeSettingsTab, setActiveSettingsTab, navigate } = useNav()
  const { user, setUser, signOut } = useUser()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeys, setApiKeys] = useState([
    { id: 'k1', name: 'Production', key: 'ax_live_sk_a8f3...c92e', created: '2 days ago' },
    { id: 'k2', name: 'Development', key: 'ax_test_sk_2b1c...f04a', created: '3 weeks ago' },
  ])

  const handleSave = () => {
    setUser({ name, email })
    toast.success('Profile updated')
  }

  const handleSignOut = () => {
    signOut()
    navigate('landing')
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied')
  }

  const generateKey = () => {
    const newKey = 'ax_live_sk_' + Math.random().toString(36).slice(2, 10) + '...' + Math.random().toString(36).slice(2, 6)
    setApiKeys((prev) => [{ id: 'k' + Date.now(), name: 'New key', key: newKey, created: 'just now' }, ...prev])
    toast.success('New API key generated')
  }

  if (!user) return null

  return (
    <AppShell activeView="settings">
      <div className="h-full overflow-y-auto axiom-scroll-thin">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-muted-foreground">Manage your account, appearance, billing, and data.</p>
          </motion.div>

          <div className="grid lg:grid-cols-[220px_1fr] gap-8">
            {/* Tab nav */}
            <nav className="space-y-0.5 lg:sticky lg:top-0 lg:self-start">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveSettingsTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm transition-colors',
                    activeSettingsTab === t.id
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
              <div className="h-px bg-border my-2" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>

            {/* Tab content */}
            <div className="min-w-0">
              {activeSettingsTab === 'profile' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-lg font-semibold mb-1">Profile</h2>
                    <p className="text-sm text-muted-foreground mb-6">Update your personal information.</p>

                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-lg">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">Change avatar</Button>
                        <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs">Full name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-background/50" />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setName(user.name); setEmail(user.email) }}>Cancel</Button>
                      <Button size="sm" onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90">Save changes</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-base font-semibold mb-1">Custom instructions</h2>
                    <p className="text-sm text-muted-foreground mb-4">Tell Axiom how to respond by default. This applies to all new chats.</p>
                    <textarea
                      rows={4}
                      placeholder="e.g. Always respond in a concise, technical tone. Prefer code examples over prose."
                      className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => toast.success('Instructions saved')}>Save</Button>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'appearance' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                    <p className="text-sm text-muted-foreground mb-6">Customize how Axiom looks on your device.</p>

                    <div className="space-y-2">
                      <Label className="text-xs">Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'system', label: 'System', icon: Monitor },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                              theme === t.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/50'
                            )}
                          >
                            <t.icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{t.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Dark mode is the default and the hero experience.</p>
                    </div>

                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Reduce motion</div>
                          <div className="text-xs text-muted-foreground">Minimize animations and transitions.</div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Compact density</div>
                          <div className="text-xs text-muted-foreground">Tighter spacing in sidebars and lists.</div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Show line numbers in Studio</div>
                          <div className="text-xs text-muted-foreground">Display line numbers in the code editor.</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'billing' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current plan</div>
                        <div className="text-2xl font-semibold capitalize">{user.plan}</div>
                        <div className="text-sm text-muted-foreground mt-1">{user.plan === 'free' ? 'Limited monthly credits' : '$20/month · renews Oct 4'}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('pricing')}>Change plan</Button>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Credits used this month</span>
                        <span className="font-mono">{user.creditsTotal - user.credits} / {user.creditsTotal}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${((user.creditsTotal - user.credits) / user.creditsTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h3 className="font-semibold text-sm mb-4">Payment method</h3>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-12 items-center justify-center rounded bg-gradient-to-br from-zinc-700 to-zinc-900 text-[10px] text-white font-bold">VISA</div>
                        <div>
                          <div className="text-sm font-medium">•••• 4242</div>
                          <div className="text-xs text-muted-foreground">Expires 08/27</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      <CreditCard className="mr-2 h-3.5 w-3.5" />
                      Add payment method
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Billing history</h3>
                      <Button variant="ghost" size="sm" className="text-xs">View all</Button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { date: 'Sep 1, 2026', amount: '$20.00', status: 'Paid' },
                        { date: 'Aug 1, 2026', amount: '$20.00', status: 'Paid' },
                        { date: 'Jul 1, 2026', amount: '$20.00', status: 'Paid' },
                      ].map((inv) => (
                        <div key={inv.date} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">{inv.date}</div>
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">{inv.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono">{inv.amount}</span>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'api' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold">API keys</h2>
                      <Button size="sm" onClick={generateKey}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Generate key
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">Use these keys to access the Axiom API from your own apps. Never share them publicly.</p>

                    <div className="space-y-2">
                      {apiKeys.map((k) => (
                        <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{k.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {showApiKey ? k.key : k.key.replace(/.(?=.{4})/g, '•')}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground hidden sm:inline">{k.created}</span>
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => copyKey(k.key)}
                            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setApiKeys((prev) => prev.filter((x) => x.id !== k.id))}
                            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'data' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-lg font-semibold mb-1">Data controls</h2>
                    <p className="text-sm text-muted-foreground mb-6">Your data is yours. Manage what we store and how long.</p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Save chat history</div>
                          <div className="text-xs text-muted-foreground">Store your conversations for future reference.</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Index codebase in Studio</div>
                          <div className="text-xs text-muted-foreground">Create embeddings for @codebase mentions.</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Share usage for model improvement</div>
                          <div className="text-xs text-muted-foreground">Help us improve Axiom. Off by default.</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h3 className="font-semibold text-sm mb-3">Export your data</h3>
                    <p className="text-sm text-muted-foreground mb-4">Download all your chats, projects, and settings as JSON.</p>
                    <Button variant="outline" size="sm" onClick={() => toast.success('Export started', { description: 'You\'ll get an email when it\'s ready.' })}>
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Request export
                    </Button>
                  </div>

                  <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
                    <h3 className="font-semibold text-sm text-red-400 mb-2">Danger zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                    <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => toast.error('Account deletion requires confirmation email')}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete account
                    </Button>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'notifications' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-lg font-semibold mb-1">Notifications</h2>
                    <p className="text-sm text-muted-foreground mb-6">Choose what we email you about.</p>
                    <div className="space-y-4">
                      {[
                        { label: 'Product updates', desc: 'New features and improvements', on: true },
                        { label: 'Usage alerts', desc: 'When you approach your credit limit', on: true },
                        { label: 'Security alerts', desc: 'Sign-in activity and API key changes', on: true },
                        { label: 'Marketing', desc: 'Tips, case studies, and offers', on: false },
                      ].map((n) => (
                        <div key={n.label} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{n.label}</div>
                            <div className="text-xs text-muted-foreground">{n.desc}</div>
                          </div>
                          <Switch defaultChecked={n.on} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}

              {activeSettingsTab === 'security' && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h2 className="text-lg font-semibold mb-1">Security</h2>
                    <p className="text-sm text-muted-foreground mb-6">Protect your account.</p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Change password</Label>
                        <Input type="password" placeholder="Current password" className="h-10 bg-background/50" />
                        <Input type="password" placeholder="New password" className="h-10 bg-background/50" />
                        <Input type="password" placeholder="Confirm new password" className="h-10 bg-background/50" />
                        <Button size="sm" className="mt-2">Update password</Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">Two-factor authentication</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/30 p-6">
                    <h3 className="font-semibold text-sm mb-3">Active sessions</h3>
                    <div className="space-y-2">
                      {[
                        { device: 'MacBook Pro · Chrome', location: 'San Francisco, US', current: true },
                        { device: 'iPhone 15 · Safari', location: 'San Francisco, US', current: false },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              {s.device}
                              {s.current && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">Current</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{s.location}</div>
                          </div>
                          {!s.current && <Button variant="ghost" size="sm" className="text-xs text-destructive">Revoke</Button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
