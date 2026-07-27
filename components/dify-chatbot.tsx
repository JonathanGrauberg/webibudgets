'use client'
// components/dify-chatbot.tsx
import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export function DifyChatbot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana flotante del Chatbot */}
      {isOpen && (
        <div className="mb-4 h-[600px] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header del Chat */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-900 px-4 py-3 text-white dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold">Asistente .budgets</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Iframe oficial de Dify */}
          <iframe
            src="https://udify.app/chatbot/xpbHkRff8XxmaG6g"
            className="h-[calc(100%-49px)] w-full border-none"
            allow="microphone"
          />
        </div>
      )}

      {/* Botón flotante para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-amber-400 active:scale-95"
        aria-label="Abrir asistente virtual"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6 fill-current" />
        )}
      </button>
    </div>
  )
}