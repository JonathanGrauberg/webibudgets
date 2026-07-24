"use client";

import { motion } from "framer-motion";

// Dimensiones del viewBox del mapa (coinciden con el rango del polígono: x 0–85, y 0–105)
const MAP_W = 85;
const MAP_H = 105;

type Marker = {
  id: string;
  country: string;
  city: string;
  flag: string;
  x: number; // coordenadas en el mismo sistema que el viewBox del SVG
  y: number;
};

// 👈 Sumá o corregí ubicaciones acá a medida que .budgets se expanda a nuevos países
const markers: Marker[] = [
  { id: "co", country: "Colombia", city: "Bogotá", flag: "🇨🇴", x: 28, y: 10 },
  { id: "ve", country: "Venezuela", city: "Caracas", flag: "🇻🇪", x: 48, y: 13 },
  { id: "ar", country: "Argentina", city: "Bs. As. — Entre Ríos", flag: "🇦🇷", x: 43, y: 79 },
];

function pointFor(x: number, y: number) {
  return { left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` };
}

export function PresenceMap() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 mt-[-80px]">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-16 text-neutral-50 lg:px-14 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          {/* ── COPY ── */}
          <div>
            <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-neutral-500">
              Presencia regional
            </span>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              De Entre Ríos a toda Latinoamérica.
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-neutral-400">
              .budgets ya gestiona presupuestos todos los días en Argentina, Venezuela y
              Colombia. Un mismo sistema, adaptado a la moneda y la identidad de cada negocio.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {markers.map((m) => (
                <span
                  key={m.id}
                  className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300"
                >
                  <span className="text-base leading-none">{m.flag}</span>
                  {m.country}
                </span>
              ))}
              <span className="flex items-center gap-2 rounded-full border border-dashed border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-500">
                + próximamente
              </span>
            </div>
          </div>

          {/* ── MAPA ── */}
          <div className="relative aspect-[17/21] w-full max-w-[280px] mx-auto lg:mx-0">
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#262626" />
                  <stop offset="100%" stopColor="#171717" />
                </linearGradient>
              </defs>

              {/* silueta low-poly, estilizada — no busca precisión cartográfica */}
              <polygon
                points="20,5 35,1 60,10 65,20 80,32 75,42 70,52 55,62 50,72 44,88 38,100 28,80 29,70 30,58 30,48 20,36 15,24"
                fill="url(#landGradient)"
                stroke="#404040"
                strokeWidth="0.4"
              />
              {/* facetas internas: abanico de líneas desde un centroide hacia cada vértice del contorno */}
              <g stroke="#0a0a0a" strokeWidth="0.3" opacity="0.5">
                {[
                  [20, 5], [35, 1], [60, 10], [65, 20], [80, 32], [75, 42], [70, 52],
                  [55, 62], [50, 72], [44, 88], [38, 100], [28, 80], [29, 70],
                  [30, 58], [30, 48], [20, 36], [15, 24],
                ].map(([px, py], i) => (
                  <line key={i} x1={44} y1={47} x2={px} y2={py} />
                ))}
              </g>

              {/* líneas de conexión entre las 3 ciudades, animadas */}
              {[
                [markers[0], markers[1]],
                [markers[0], markers[2]],
                [markers[1], markers[2]],
              ].map(([a, b], i) => (
                <motion.line
                  key={`${a.id}-${b.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#fcc107"
                  strokeWidth="0.3"
                  strokeDasharray="1.5 1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.5 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: "easeOut" }}
                />
              ))}
            </svg>

            {/* marcadores pulsantes + etiquetas, posicionados sobre el SVG */}
            {markers.map((m, i) => (
              <div
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={pointFor(m.x, m.y)}
              >
                <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <motion.span
                    className="absolute h-2.5 w-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeOut",
                    }}
                  />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
                  className="absolute left-1/2 top-4 w-max -translate-x-1/2 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-center shadow-lg"
                >
                  <p className="text-[11px] font-semibold leading-none text-neutral-50">
                    {m.flag} {m.country}
                  </p>
                  <p className="mt-1 text-[9.5px] leading-none text-neutral-500">{m.city}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}