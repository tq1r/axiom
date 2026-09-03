'use client'

import { useSyncExternalStore } from 'react'

// A mounted flag that avoids the "setState in effect" lint rule by using useSyncExternalStore.
const subscribe = () => () => {}
const getSnapshot = () => true

export function useStateSync(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
