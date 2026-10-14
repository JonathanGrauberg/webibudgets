'use client'

import { useEffect, useState } from 'react'

// Fondo de marca a pantalla completa para el login (la tarjeta va por encima).
// Si existe /public/auth-hero.webp se muestra esa imagen; si no, queda el fondo
// negro con las curvas doradas de la marca.
const CURVES = [
  'M -40 120 C 200 -60, 520 40, 460 260 C 400 470, 120 420, 140 600 C 160 780, 520 700, 620 860 C 740 1050, 380 1150, 200 1090 C 80 1050, -20 1100, -60 1200',
  'M 1120 80 C 940 160, 820 140, 840 300 C 860 450, 1040 420, 1000 620 C 960 820, 700 880, 760 1060 C 820 1230, 1040 1180, 1120 1100',
  'M 300 1960 C 180 1800, 200 1660, 340 1640 C 480 1620, 560 1760, 660 1700 C 760 1640, 700 1480, 760 1420 C 840 1350, 900 1500, 860 1700 L 840 1960',
  'M 1120 1300 C 960 1280, 820 1380, 880 1540 C 920 1650, 1040 1640, 1120 1590',
  'M -40 1500 C 120 1420, 260 1480, 240 1580 C 220 1680, 60 1700, -40 1780',
]

export function AuthHero() {
  const [hasImage, setHasImage] = useState(false)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setHasImage(true)
    img.src = '/auth-hero.webp'
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a]">
      <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {CURVES.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#fcc107" strokeOpacity={0.2} strokeWidth={70} strokeLinecap="round" />
        ))}
      </svg>

      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/auth-hero.webp" alt="" className="absolute inset-0 h-full w-full origin-right scale-[1.2] object-cover object-center" />
      )}

      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-x-0 bottom-0 hidden flex-col items-start bg-gradient-to-t from-black/75 to-transparent px-8 pb-8 pt-24 text-left sm:px-12 sm:pb-10 sm:flex">
        <p className="text-3xl font-black tracking-tighter text-white leading-none sm:text-4xl">
          <span className="text-[#fcc107]">.</span>budgets
        </p>
        <p className="mt-2 max-w-sm text-sm font-medium text-white/85">
          Tu negocio ordenado. Tu tiempo, de vuelta.
        </p>
      </div>
    </div>
  )
}
