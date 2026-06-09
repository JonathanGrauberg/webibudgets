import { Menu, X } from 'lucide-react'
import Link from 'next/link'

interface LandingNavProps {
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  dashboardHref: string
  dashboardLabel: string
}

export function LandingNav({
  isMenuOpen,
  setIsMenuOpen,
  dashboardHref,
  dashboardLabel,
}: LandingNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 bg-[#fcc107] rounded-lg flex items-center justify-center shadow-lg shadow-[#fcc107]/30">
              <span className="text-black font-black text-sm">W</span>
            </div>
            <span className="font-bold text-lg text-white hidden sm:inline tracking-tight">
              Webi<span className="text-[#fcc107]">Budgets</span>
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {['#features', '#pricing', '#testimonials', '#faq'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-white/60 hover:text-[#fcc107] transition-colors"
              >
                {['Funciones', 'Precios', 'Testimonios', 'FAQ'][i]}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle removed for MVP */}

            <Link
              href={dashboardHref}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fcc107] text-black text-sm font-bold hover:bg-[#fcc107]/90 transition shadow-lg shadow-[#fcc107]/25"
            >
              {dashboardLabel === 'Dashboard' ? 'Ir al panel' : 'Iniciar sesión'}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1">
            {['#features', '#pricing', '#testimonials', '#faq'].map((href, i) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition"
              >
                {['Funciones', 'Precios', 'Testimonios', 'FAQ'][i]}
              </a>
            ))}
            <div className="pt-2 px-2">
              <Link
                href={dashboardHref}
                className="block text-center py-2.5 rounded-xl bg-[#fcc107] text-black text-sm font-bold"
              >
                {dashboardLabel === 'Dashboard' ? 'Ir al panel' : 'Iniciar sesión'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}