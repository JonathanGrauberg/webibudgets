// lib/calc-widget-prefs.ts
//
// Preferencia personal (no de la empresa) de la calculadora flotante —
// vive en localStorage, por navegador, no en la base de datos. Activada
// por defecto. Compartido entre el widget (components/floating-calculator.tsx)
// y el switch en Configuración, que se avisan entre sí con un evento
// custom porque localStorage no dispara re-render solo.
export const CALC_WIDGET_STORAGE_KEY = 'budgets-calc-widget-enabled'
export const CALC_WIDGET_TOGGLE_EVENT = 'calc-widget-toggle'

export function isCalcWidgetEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(CALC_WIDGET_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setCalcWidgetEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CALC_WIDGET_STORAGE_KEY, String(enabled))
  } catch {}
  window.dispatchEvent(new Event(CALC_WIDGET_TOGGLE_EVENT))
}
