// app/kiosco/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/kiosco-manifest.json', // 👈 nuevo — pisa el manifest general, solo acá adentro
  icons: {
    apple: '/icon-kiosco-192-square.png', // 👈 nuevo
  },
}

export default function KioscoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {children}
    </div>
  )
}