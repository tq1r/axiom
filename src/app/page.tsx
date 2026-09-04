'use client'

import { useEffect } from 'react'
import { AxiomApp } from '@/components/axiom/axiom-app'
import { useNav } from '@/lib/axiom/store'

export default function Home() {
  const { view } = useNav()

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [view])

  return <AxiomApp />
}
