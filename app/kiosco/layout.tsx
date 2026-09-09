// app/kiosco/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/kiosco-manifest.json',
  icons: {
    apple: '/icon-kiosco-192-maskable.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Kiosco', // 👈 nuevo — nombre distinto, para que iOS lo trate como identidad separada
    statusBarStyle: 'black-translucent',
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