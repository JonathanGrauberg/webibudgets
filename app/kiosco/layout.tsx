// app/kiosco/layout.tsx — nuevo
export default function KioscoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }} // 👈 evita el notch/dynamic island de iPad/iPhone
    >
      {children}
    </div>
  )
}