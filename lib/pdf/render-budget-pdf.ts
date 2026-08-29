// lib\pdf\render-budget-pdf.ts
//
// Único punto de entrada para generar el HTML del PDF de presupuesto.
// Elige la plantilla según tenant.pdfTemplate (default: "clasico") sin que
// el resto del flujo (route.ts, generatePdf, merge de condiciones, etc.)
// tenga que saber que existe más de una.
//
// Para sumar una plantilla nueva el día de mañana: crear
// lib/pdf/template-<nombre>.ts con la misma firma que budgetPdfTemplate,
// importarla acá abajo y agregar un case.
//
// 👉 No valida el plan/feature del tenant acá — ese gating vive en la UI
// (mismo criterio que el resto de las funciones PRO del proyecto, ej.
// "quitar marca de agua" en company-branding-settings-client.tsx). Si en
// algún momento se agrega enforcement real en la API, este es el lugar.

import { budgetPdfTemplate } from '@/lib/pdf/template'
import { budgetPdfTemplateContraste } from '@/lib/pdf/template-contraste'
import { budgetPdfTemplateCantonera } from '@/lib/pdf/template-cantonera'
import { budgetPdfTemplateDirecta } from '@/lib/pdf/template-directa'

export function renderBudgetPdf(budget: any, opts?: any) {
  const template = opts?.tenant?.pdfTemplate ?? 'clasico'

  switch (template) {
    case 'contraste':
      return budgetPdfTemplateContraste(budget, opts)
    case 'cantonera':
      return budgetPdfTemplateCantonera(budget, opts)
    case 'directa':
      return budgetPdfTemplateDirecta(budget, opts)
    case 'clasico':
    default:
      return budgetPdfTemplate(budget, opts)
  }
}
