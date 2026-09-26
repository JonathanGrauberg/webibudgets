'use client'
//components\settings\company\arca-settings-card.tsx
//
// Pasos 1 y 2 de facturación electrónica ARCA: generar el certificado
// (clave privada + CSR) y subir el .crt que devuelve ARCA. Configurar
// punto de venta y emitir comprobantes todavía no está armado — esto es a
// propósito, mismo criterio que usamos para arrancar con Mercado Pago.

import React, { useEffect, useState } from 'react'
import { Landmark, Download, Loader2, ExternalLink, Upload, CheckCircle2 } from 'lucide-react'
import { getContrastColor } from '@/lib/contrast'

interface ColorSystem {
  primary: string
  accent: string
}

interface ArcaStatus {
  cuit: string
  environment: 'testing' | 'production'
  alias: string | null
  puntoVenta: number | null
  status: string
  certificateExpiresAt: string | null
}

export default function ArcaSettingsCard({ colors }: { colors: ColorSystem }) {
  const [status, setStatus] = useState<ArcaStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [cuit, setCuit] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [commonName, setCommonName] = useState('')
  const [alias, setAlias] = useState('')
  const [environment, setEnvironment] = useState<'testing' | 'production'>('testing')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrGenerated, setCsrGenerated] = useState(false)

  const [certificateText, setCertificateText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [testingWsaa, setTestingWsaa] = useState(false)
  const [wsaaResult, setWsaaResult] = useState<{ ok: boolean; message?: string } | null>(null)

  useEffect(() => {
    fetch('/api/arca/generate-csr')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data))
      .finally(() => setLoadingStatus(false))
  }, [])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/arca/generate-csr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuit, organizationName, commonName, alias, environment }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.error ?? 'No se pudo generar el certificado')
        return
      }

      // Descarga el .csr en el navegador del usuario
      const blob = new Blob([json.csr], { type: 'application/pkcs10' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${alias || 'certificado'}.csr`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setCsrGenerated(true)
      setStatus({ cuit: cuit.replace(/\D/g, ''), environment, alias: alias || null, puntoVenta: null, status: 'pending_csr', certificateExpiresAt: null })
    } catch {
      setError('No se pudo generar el certificado')
    } finally {
      setGenerating(false)
    }
  }

  async function handleTestWsaa() {
    setTestingWsaa(true)
    setWsaaResult(null)
    try {
      const res = await fetch('/api/arca/test-wsaa', { method: 'POST' })
      const json = await res.json().catch(() => null)
      setWsaaResult(res.ok ? { ok: true } : { ok: false, message: json?.error ?? 'No se pudo conectar con WSAA' })
    } catch {
      setWsaaResult({ ok: false, message: 'No se pudo conectar con WSAA' })
    } finally {
      setTestingWsaa(false)
    }
  }

  function handleCertificateFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCertificateText(String(reader.result || ''))
    reader.readAsText(file)
  }

  async function handleUploadCertificate(e: React.FormEvent) {
    e.preventDefault()
    setUploadError(null)
    setUploading(true)
    try {
      const res = await fetch('/api/arca/upload-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificatePem: certificateText }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setUploadError(json?.error ?? 'No se pudo procesar el certificado')
        return
      }
      setStatus((prev) => (prev ? { ...prev, status: 'active', certificateExpiresAt: json.expiresAt } : prev))
      setCertificateText('')
    } catch {
      setUploadError('No se pudo procesar el certificado')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
      />
      <div className="px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
          >
            <Landmark className="w-5 h-5" style={{ color: getContrastColor(colors.primary) }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Facturación electrónica (ARCA)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">En construcción — generar certificado y subirlo</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Todavía no se puede facturar desde acá — falta la autenticación (WSAA) y la emisión real de comprobantes (WSFEv1). Esto deja lista la parte del certificado.
        </div>

        {!loadingStatus && status && (
          <div
            className={`mb-5 rounded-lg px-3 py-2.5 text-sm ${
              status.status === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/20'
                : 'bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              {status.status === 'active' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              Certificado para CUIT <strong>{status.cuit}</strong> ({status.environment === 'production' ? 'Producción' : 'Homologación/Testing'})
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {status.status === 'active'
                ? `Activo — vence el ${status.certificateExpiresAt ? new Date(status.certificateExpiresAt).toLocaleDateString('es-AR') : '?'}`
                : 'Esperando que subas el certificado (.crt) que te dé ARCA'}
            </p>

            {status.status === 'active' && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleTestWsaa}
                  disabled={testingWsaa}
                  className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                >
                  {testingWsaa ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {testingWsaa ? 'Conectando con ARCA...' : 'Probar conexión (WSAA)'}
                </button>
                {wsaaResult && (
                  <p className={`mt-2 text-xs ${wsaaResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {wsaaResult.ok ? '✓ ARCA aceptó el certificado y devolvió un Ticket de Acceso válido' : wsaaResult.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {status && (
          <form onSubmit={handleUploadCertificate} className="mb-6 space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {status.status === 'active' ? 'Reemplazar certificado' : 'Subir el certificado (.crt) que te dio ARCA'}
            </p>
            <input
              type="file"
              accept=".crt,.pem,.cer"
              onChange={handleCertificateFile}
              className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs dark:file:bg-slate-800"
            />
            <textarea
              value={certificateText}
              onChange={(e) => setCertificateText(e.target.value)}
              placeholder="...o pegá el contenido del .crt acá (-----BEGIN CERTIFICATE-----)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono outline-none focus:border-slate-400"
            />
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            <button
              type="submit"
              disabled={uploading || !certificateText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Validando...' : 'Confirmar certificado'}
            </button>
          </form>
        )}

        {status && (
          <p className="mb-2 text-xs text-slate-400">
            Generar de nuevo acá abajo crea una clave y un CSR nuevos — el certificado que ya tenías activo dejaría de servir hasta que subas uno nuevo que corresponda a esta clave.
          </p>
        )}

        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">CUIT (con el que vas a facturar)</label>
            <input
              type="text"
              required
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="20120940288"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nombre de la empresa (campo "O" del certificado)</label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Mi Empresa SRL"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nombre técnico del certificado (campo "CN")</label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="facturacion-budgets"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Alias (para vos, en ARCA)</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="facturacion1"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Solo letras y números (sin guiones ni símbolos) — ARCA no acepta otra cosa ahí. No es obligatorio, pero conviene poner el mismo nombre acá y en el "Nombre simbólico del DN" cuando crees el certificado en ARCA, para no confundirte entre los dos.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Entorno</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'testing' | 'production')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="testing">Homologación (testing)</option>
                <option value="production">Producción</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {generating ? 'Generando...' : 'Generar certificado y descargar CSR'}
          </button>
        </form>

        {csrGenerated && (
          <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <p className="font-medium">Se descargó tu archivo .csr — ahora andá a ARCA:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Testing:{' '}
                <a
                  href="https://www.arca.gob.ar/ws/WSASS/html/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline"
                >
                  WSASS <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Producción: entrá con tu Clave Fiscal → "Administrador de Certificados Digitales"</li>
              <li>Subí el .csr que se descargó, con el mismo Alias que pusiste acá</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
