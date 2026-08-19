// components/legal/legal-content.tsx
import React from 'react'

// Parser minimalista — soporta solo lo que usan nuestros documentos legales:
// #, ##, ### para headers, **negrita** inline, listas con "- ", y párrafos sueltos.
// No es un parser de Markdown general, a propósito: evita sumar una dependencia
// nueva solo para renderizar dos documentos estáticos y controlados por nosotros.

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export function LegalContent({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  const blocks: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-3 list-disc space-y-1.5 pl-6">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-slate-700">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()

    if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2))
      return
    }
    flushList()

    if (line === '') return

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={idx} className="mb-2 mt-5 text-base font-semibold text-slate-900">
          {renderInline(line.slice(4))}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={idx} className="mb-3 mt-8 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
          {renderInline(line.slice(3))}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={idx} className="mb-4 text-3xl font-black tracking-tight text-slate-900">
          {renderInline(line.slice(2))}
        </h1>
      )
    } else {
      blocks.push(
        <p key={idx} className="mb-3 text-sm leading-relaxed text-slate-700">
          {renderInline(line)}
        </p>
      )
    }
  })
  flushList()

  return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">{blocks}</div>
}