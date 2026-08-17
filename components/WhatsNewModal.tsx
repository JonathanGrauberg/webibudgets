"use client";
//components\WhatsNewModal.tsx
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Monitor,
  QrCode,
  Handshake,
  BarChart3,
  Check,
} from "lucide-react";

// 👈 Subí este valor cada vez que agregues una nueva tanda de novedades.
// Al cambiar, el modal vuelve a mostrarse aunque el usuario ya haya visto una versión anterior.
const RELEASE_VERSION = "2.0.0";
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
    eyebrow: "Modo Kiosco",
    title: "El taller, siempre a la vista",
    description:
      "Una tablet en la pared, con tableros por proyecto como una guía telefónica. El equipo mueve tareas con el dedo, y si algo es urgente, suena una alarma que no se puede ignorar.",
    icon: <Monitor size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="p-3.5">
          <div className="mb-2 flex items-center justify-center rounded-lg bg-yellow-400 py-1.5 text-[10px] font-black text-neutral-900">
            .budgets
          </div>
          <div className="flex items-end gap-1">
            <span className="rounded-t-md bg-neutral-900 px-2.5 py-1.5 text-[9px] font-semibold text-white">
              Placard Sr. Gómez
            </span>
            <span className="rounded-t-md bg-neutral-100 px-2.5 py-1.5 text-[9px] font-medium text-neutral-500">
              Reunión
            </span>
            <span className="rounded-t-md bg-neutral-100 px-2 py-1.5 text-[9px] font-medium text-neutral-500">
              +
            </span>
          </div>
          <div className="mt-1.5 space-y-1.5 rounded-b-lg rounded-tr-lg border border-neutral-100 bg-neutral-50/60 p-2">
            <div className="flex items-center justify-between rounded-md border-l-[3px] border-red-500 bg-white px-2 py-1.5 shadow-sm">
              <span className="text-[9px] font-semibold text-neutral-800">
                Armar placard — falta bisagras
              </span>
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] font-bold text-red-600">
                Urgente
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-neutral-100 bg-white px-2 py-1.5">
              <span className="text-[9px] text-neutral-600">Cortar placas de melamina</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Órdenes de Trabajo",
    title: "Del papel al QR, en un toque",
    description:
      "Armá la orden con checklist para el instalador, dirección con mapa incluido, y un QR que el cliente escanea para ver el estado en vivo — sin llamados de '¿ya terminaron?'.",
    icon: <QrCode size={22} />,
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
              Orden de Trabajo #0032
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <QrCode size={12} />
            </span>
          </div>
          <div className="space-y-1.5">
            {["Medir espacio de instalación", "Confirmar materiales en el móvil", "Instalar y nivelar"].map(
              (t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-neutral-100 px-2.5 py-1.5"
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                      i < 2 ? "border-emerald-400 bg-emerald-400" : "border-neutral-300"
                    }`}
                  >
                    {i < 2 && <Check size={9} className="text-white" />}
                  </span>
                  <span
                    className={`text-[9.5px] ${
                      i < 2 ? "text-neutral-400 line-through" : "font-medium text-neutral-700"
                    }`}
                  >
                    {t}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Rendiciones",
    title: "Reparto de ganancias, sin planillas",
    description:
      "Definí cómo se divide la ganancia entre vendedores y socios, y .budgets calcula el reparto del período solo — con historial completo para auditar cuando quieras.",
    icon: <Handshake size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="p-3.5">
          <p className="mb-2 text-[10px] font-semibold text-neutral-700">Reparto del período</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] text-neutral-600">Rubén Pérez (vendedor)</span>
              <span className="text-[10px] font-bold text-neutral-900">$ 84.320</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-[62%] rounded-full bg-yellow-400" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9.5px] text-neutral-600">Socio / Taller</span>
              <span className="text-[10px] font-bold text-neutral-900">$ 51.480</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-[38%] rounded-full bg-neutral-900" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Dashboard Ejecutivo",
    title: "Tu negocio, de un vistazo",
    description:
      "Ingresos aprobados, pipeline en cotización, ratio de conversión y tus productos más pedidos — todo en un dashboard que se actualiza solo, filtrable por mes, año o histórico.",
    icon: <BarChart3 size={22} />,
    preview: (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
        </div>
        <div className="space-y-1.5 p-3.5">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2">
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-emerald-700">
              Ingresos aprobados
            </p>
            <p className="text-[13px] font-black text-neutral-900">$ 1.527.215</p>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 rounded-lg border border-neutral-100 p-2">
              <p className="text-[8px] font-semibold uppercase text-neutral-400">Pipeline</p>
              <p className="text-[11px] font-bold text-neutral-900">$ 342.000</p>
            </div>
            <div className="flex-1 rounded-lg border border-neutral-100 p-2">
              <p className="text-[8px] font-semibold uppercase text-neutral-400">Conversión</p>
              <p className="text-[11px] font-bold text-neutral-900">38%</p>
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