"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Percent,
  Coins,
  Wand2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Sparkles,
  ChevronDown,
  Search,
} from "lucide-react";

// 👈 Subí este valor cada vez que agregues una nueva tanda de novedades.
// Al cambiar, el modal vuelve a mostrarse aunque el usuario ya haya visto una versión anterior.
const RELEASE_VERSION = "1.2.0";
const STORAGE_KEY = `budgets_whatsnew_seen_${RELEASE_VERSION}`;

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  preview: ReactNode;
};

const slides: Slide[] = [
  {
    eyebrow: "Actualización de precios",
    title: "Actualizá todo de una",
    description:
      "Subí o bajá precios por porcentaje, para todo tu catálogo o solo para una categoría puntual. Elegís el alcance, definís el porcentaje y .budgets recalcula todo en segundos.",
    icon: <Percent size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] text-neutral-400">
              <Search size={11} />
              Buscar productos...
            </div>
          </div>
          <div className="mb-2.5 flex items-center justify-end gap-1.5">
            <span className="relative flex items-center gap-1 rounded-lg bg-yellow-400 px-2.5 py-1.5 text-[10px] font-bold text-neutral-900">
              <Percent size={11} />
              Actualizar Precios
              <span className="absolute -top-7 right-0 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[9px] font-medium text-white">
                Modificar precios por porcentaje
              </span>
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <Plus size={12} />
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-neutral-800">
                  Mantenimiento Web
                </span>
                <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[8px] font-semibold text-yellow-700">
                  Servicios
                </span>
              </div>
              <span className="text-[10px] font-bold text-neutral-900">$ 193.568</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-neutral-800">
                  Ecommerce web
                </span>
                <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[8px] font-semibold text-yellow-700">
                  Servicios
                </span>
              </div>
              <span className="text-[10px] font-bold text-neutral-900">$ 150.000</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Multi-moneda",
    title: "Cada cliente, en su moneda",
    description:
      "Configurá la moneda de tu empresa (ARS, USD, CLP, EUR y más) desde branding. Tus presupuestos se generan y se ven en la moneda correcta, sin conversiones manuales.",
    icon: <Coins size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="p-3.5">
          <p className="mb-1.5 text-[10px] font-semibold text-neutral-700">
            Moneda por defecto
          </p>
          <div className="flex items-center justify-between rounded-lg border border-sky-300 px-2.5 py-2 text-[10px] font-medium text-neutral-800 ring-2 ring-sky-100">
            ARS — Peso Argentino
            <ChevronDown size={12} className="text-neutral-400" />
          </div>
          <p className="mt-1.5 text-[8.5px] leading-snug text-neutral-400">
            Moneda usada por defecto en nuevos productos y presupuestos.
          </p>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Productos al instante",
    title: "Lo hecho a medida, también entra",
    description:
      "Con on-the-fly cargás un producto único directo en el presupuesto, sin pasar por tu stock. Ideal para trabajos a medida que vas a facturar una sola vez.",
    icon: <Wand2 size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-800">
              Productos / Servicios
            </span>
            <span className="flex items-center gap-1 rounded-lg border border-yellow-300 bg-yellow-50 px-2 py-1 text-[9px] font-semibold text-yellow-700">
              <Sparkles size={10} />
              Item Libre (On-the-fly)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] text-neutral-400">
              Seleccionar de la lista base...
              <ChevronDown size={11} />
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <Plus size={12} />
            </span>
          </div>
          <div className="mt-2.5 rounded-lg border border-dashed border-neutral-200 p-2">
            <p className="text-[9px] font-semibold text-neutral-500">
              Mueble a medida — living
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[9px] text-neutral-400">Cantidad: 1</span>
              <span className="text-[10px] font-bold text-neutral-900">$ 85.000</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Pequeño delay para que no compita con la animación de entrada de la landing
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const goTo = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const stopPropagation = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const isLast = step === slides.length - 1;
  const current = slides[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/70 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={stopPropagation}
          >
            <div className="flex items-start justify-between px-7 pt-7">
              <div>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Novedades · v{RELEASE_VERSION}
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  <span className="text-primary">.budgets</span>
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-[320px] px-7 pb-1 pt-5">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col gap-2.5"
                >
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    {current.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    {current.eyebrow}
                  </span>
                  <h3 className="text-xl font-bold leading-snug text-foreground">
                    {current.title}
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {current.description}
                  </p>
                  {current.preview}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-7 pb-7 pt-5">
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Ir a la novedad ${i + 1}`}
                    className={
                      i === step
                        ? "h-1.5 w-5 rounded-full bg-primary transition-all"
                        : "h-1.5 w-1.5 rounded-full bg-border transition-all"
                    }
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => goTo(step - 1)}
                    aria-label="Novedad anterior"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-secondary"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                {!isLast ? (
                  <button
                    onClick={() => goTo(step + 1)}
                    className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
                  >
                    Siguiente
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={close}
                    className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}