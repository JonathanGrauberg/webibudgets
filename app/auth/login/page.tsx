//app\auth\login\page.tsx
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}