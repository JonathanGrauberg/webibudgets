'use client'
// components/help/help-manual.tsx
//
// Componente único de manual/ayuda, reusado en la página pública
// (app/(public)/manual) y en la del dashboard (app/(dashboard)/help).
// Todo el contenido vive en lib/help-content.ts — acá solo se arma la UI.
//
// 👇 A propósito TODO el contenido (de todas las categorías y artículos)
// está siempre en el HTML — usamos <details>/<summary> nativo en vez de
// mostrar/ocultar con estado de React. Así funciona como acordeón para
// el usuario, pero un buscador (Google incluido) lee el texto completo
// aunque esté colapsado visualmente — nada queda "escondido" del todo.

import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { HELP_CATEGORIES, searchHelp } from '@/lib/help-content'

export function HelpManual() {
  const [query, setQuery] = useState('')
  const searchResults = useMemo(() => searchHelp(query), [query])
  const isSearching = query.trim().length > 0

  const detailsRefs = useRef<Record<string, HTMLDetailsElement | null>>({})

  function jumpTo(categorySlug: string, articleSlug: string) {
    const key = `${categorySlug}-${articleSlug}`
    const el = detailsRefs.current[key]
    if (el) {
      el.open = true
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setQuery('')
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      {/* Buscador + navegación por categorías (anclas reales, funcionan sin JS) */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en el manual..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-foreground/30"
          />
        </div>

        {isSearching ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map(({ category, article }) => (
              <button
                key={`${category.slug}-${article.slug}`}
                type="button"
                onClick={() => jumpTo(category.slug, article.slug)}
                className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition hover:border-foreground/30"
              >
                <p className="font-medium text-card-foreground">{article.title}</p>
                <p className="text-muted-foreground">{category.title}</p>
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada por ahora. Probá otras palabras.</p>
            )}
          </div>
        ) : (
          <nav className="space-y-1">
            {HELP_CATEGORIES.map((category) => (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {category.title}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Contenido completo — siempre en el DOM, categoría por categoría */}
      <div className="min-w-0 space-y-10">
        {HELP_CATEGORIES.map((category) => (
          <section key={category.slug} id={category.slug} className="scroll-mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {category.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>

            <div className="mt-4 space-y-2.5">
              {category.articles.map((article) => (
                <details
                  key={article.slug}
                  id={`${category.slug}-${article.slug}`}
                  ref={(el) => { detailsRefs.current[`${category.slug}-${article.slug}`] = el }}
                  className="group rounded-2xl border border-border bg-card p-4 open:pb-5"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-card-foreground marker:content-none">
                    <span className="flex items-center justify-between gap-2">
                      {article.title}
                      <span className="text-xs text-muted-foreground transition group-open:rotate-180">▾</span>
                    </span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {article.body.map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
