import { ImageResponse } from 'next/og'
import { loadPublicCobro } from '@/lib/public-cobro'
import { formatCurrency } from '@/lib/format'

export const alt = 'Cobro pendiente — tocá el link para pagar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cobro = await loadPublicCobro(token)

  const tenantName = cobro?.tenant.name ?? '.budgets'
  const concept = cobro?.concept ?? 'Cobro'
  const amount = cobro ? formatCurrency(cobro.amount, cobro.currency) : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '56px 72px',
          borderTop: '24px solid #fcc107',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, color: '#475569', fontWeight: 600 }}>{tenantName}</div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 52, color: '#0f172a', fontWeight: 700 }}>
            Tenés un pago pendiente
          </div>
          <div style={{ display: 'flex', fontSize: 36, color: '#64748b', marginTop: 12 }}>{concept}</div>
          <div style={{ display: 'flex', fontSize: 120, color: '#0f172a', fontWeight: 800, marginTop: 24 }}>
            {amount}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#009ee3',
            color: '#ffffff',
            fontSize: 44,
            fontWeight: 700,
            padding: '20px 48px',
            borderRadius: 16,
          }}
        >
          Tocá el link para pagar
        </div>
      </div>
    ),
    size
  )
}
