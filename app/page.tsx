//app\page.tsx
import { Suspense } from 'react' // 👈 nuevo
import { LandingPage } from '@/components/landing/landing-page'
import { faqs } from '@/components/landing/landing-data'

// 👇 nuevo — FAQPage schema: la señal más directa que Google usa para
// respuestas tipo "AI Overview" o "la gente también pregunta". Se genera
// a partir de la misma lista de preguntas que ya se ve en la landing
// (sección #faq), una sola fuente de verdad.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    </>
  )
}