'use client'
// components/pwa-register.tsx
import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Error registrando el Service Worker:', err)
      })
    }
  }, [])

  return null
}