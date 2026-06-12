'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const words = ['Clientes', 'Productos', 'Presupuestos', 'Stock', 'Instalaciones']
const INTERVAL_MS = 1800

export function ProductosBanner() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="productos" className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-14 text-neutral-50 lg:px-14 lg:py-20">

        <p className="text-sm font-medium text-neutral-500 tracking-widest uppercase mb-4">
          Gestiona
        </p>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.h2
              key={words[index]}
              initial={{ opacity: 0, filter: 'blur(10px)', y: 30 }}
              animate={{ opacity: 1, filter: 'blur(0px)',  y: 0  }}
              exit={{    opacity: 0, filter: 'blur(10px)', y: -30 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl will-change-transform"
            >
              {words[index]}
            </motion.h2>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}