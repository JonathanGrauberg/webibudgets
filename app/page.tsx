//app\page.tsx
import { Suspense } from 'react' // 👈 nuevo
import { LandingPage } from '@/components/landing/landing-page'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  )
}