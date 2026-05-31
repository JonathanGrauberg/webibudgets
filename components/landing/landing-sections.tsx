import { ArrowRight, Play, Check, FileText, Download, Users, Package, Palette, Share2, Smartphone, Star, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { brandStats, brandSwatches, features, faqs, plans, testimonials } from './landing-data'

const icons = {
  FileText,
  Download,
  Users,
  Package,
  Palette,
  Share2,
} as const

interface LandingSectionsProps {
  openFaqIndex: number | null
  setOpenFaqIndex: (index: number | null) => void
  dashboardHref: string
  dashboardLabel: string
}

function formatStat(value: string) {
  return value
}

export function LandingSections({ openFaqIndex, setOpenFaqIndex, dashboardHref, dashboardLabel }: LandingSectionsProps) {
  return (
    <main className="overflow-x-hidden">
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-96 h-96 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Introducing WebiBudgets Pro</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Smart Budgeting for Modern Businesses
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl leading-relaxed">
            Generate quotations, manage clients, and customize your brand—all in one intuitive platform. Built for service companies that demand precision and style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black rounded-xl">
              <Link href={dashboardHref} className="flex items-center justify-center gap-2">
                {dashboardLabel === 'Dashboard' ? 'Go to Dashboard' : 'Start Free Trial'}
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="#pricing" className="flex items-center justify-center gap-2">
                <Play size={20} fill="currentColor" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 mb-16">
            No credit card required. 14-day free trial. Cancel anytime.
          </div>

          <div className="relative bg-gradient-to-b from-slate-100 to-transparent dark:from-slate-800 dark:to-transparent rounded-xl border border-slate-200 dark:border-slate-700 p-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-white dark:bg-slate-950 rounded-lg p-6 sm:p-12">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6">
                {[...Array(18)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full animate-pulse ${
                      i % 3 === 0 ? 'bg-amber-300 dark:bg-amber-500' : i % 3 === 1 ? 'bg-blue-300 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Quotations', value: '247' },
                  { label: 'Clients', value: '89' },
                  { label: 'Revenue', value: '$84K' },
                  { label: 'This Month', value: '+24%' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 w-96 h-96 bg-amber-100 dark:bg-amber-900/10 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for modern businesses who want control and flexibility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = icons[feature.icon as keyof typeof icons]
              return (
                <div
                  key={i}
                  className="group relative p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 transition-all hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={28} className="text-amber-600 dark:text-amber-400" />
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-16 p-8 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-900/20 dark:to-blue-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-bold mb-4">Responsive Dashboard</h3>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Access your business metrics anywhere, anytime. Our fully responsive interface works seamlessly on desktop, tablet, and mobile devices with real-time data synchronization.
              </p>
              <div className="flex items-center gap-4">
                <Smartphone className="text-amber-600 dark:text-amber-400" size={24} />
                <span className="font-medium">Works perfectly on all devices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose the perfect plan for your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl transition-all duration-300 ${
                  plan.featured
                    ? 'md:scale-105 bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-900/30 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-500 shadow-2xl dark:shadow-xl dark:shadow-black/40'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-black text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2">{plan.period}</span>
                  </div>

                  <Button asChild className={`w-full py-3 px-4 font-semibold rounded-lg mb-8 flex items-center justify-center gap-2 ${plan.featured ? 'bg-black dark:bg-white text-white dark:text-black hover:shadow-lg hover:shadow-black/30' : 'border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <Link href={dashboardHref}>
                      {plan.cta}
                      <ArrowRight size={18} />
                    </Link>
                  </Button>

                  <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-8">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Questions about pricing?</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Our team is here to help. Contact us for custom quotes and enterprise solutions.
                </p>
              </div>
              <Button asChild className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg whitespace-nowrap hover:shadow-lg transition-all">
                <Link href={dashboardHref}>Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 right-1/4 w-96 h-96 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Your Brand, Your Way</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Customize every aspect to match your brand identity. Your quotations will always look professional and on-brand.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold mb-4 text-lg">Brand Colors</h3>
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2">
                    {brandSwatches.map((color, index) => (
                      <div
                        key={`swatch-${index}`}
                        className="w-12 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold mb-4 text-lg">Logo Upload</h3>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <FileText size={32} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Drag and drop your logo or click to browse</p>
                  <p className="text-xs text-slate-500">PNG, SVG up to 5MB</p>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold mb-4 text-lg">Custom Fonts</h3>
                <div className="space-y-3">
                  {['Heading Font', 'Body Font', 'Accent Font'].map((label, i) => (
                    <select key={i} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <option>{label}</option>
                      <option>Inter</option>
                      <option>Poppins</option>
                      <option>Playfair Display</option>
                    </select>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-900/20 dark:to-slate-800 p-8 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div>
                        <p className="font-bold">Acme Corp</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">acme.com</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">$2,450</span>
                  </div>

                  <div className="space-y-3 mb-6 border-t border-slate-300 dark:border-slate-600 pt-6">
                    <div className="flex justify-between text-sm">
                      <span>Web Design Service</span>
                      <span>$1,500</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Development Hours (20h @ $35/h)</span>
                      <span>$700</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Project Management</span>
                      <span>$250</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 dark:border-slate-600 pt-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">$2,450</span>
                  </div>
                </div>

                <Button asChild className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:shadow-lg transition-all">
                  <Link href={dashboardHref}>Download PDF Preview</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Font Styles</p>
                  <p className="text-2xl font-bold mt-2">20+</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Templates</p>
                  <p className="text-2xl font-bold mt-2">12+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by Industry Leaders</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join thousands of businesses that have streamlined their quotation and budgeting process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 transition-all hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={18} fill="currentColor" className="text-amber-400" />
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">{testimonial.content}</p>

                <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {brandStats.map((stat, i) => (
              <div key={i} className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-4xl font-bold text-amber-500 mb-2">{formatStat(stat.value)}</p>
                <p className="text-slate-600 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/3 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Can't find the answer you're looking for? Contact our support team.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-600"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <h3 className="font-semibold text-lg text-left">{faq.question}</h3>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaqIndex === i && (
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-900/20 dark:to-blue-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-slate-700 dark:text-slate-300 mb-6">Our support team is available 24/7 to help you get the most out of WebiBudgets.</p>
            <Button asChild className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:shadow-lg transition-all">
              <Link href={dashboardHref}>Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-200 dark:bg-amber-900/30 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
            Join thousands of businesses that have streamlined their quotation process and saved hours every week. Start your free 14-day trial today—no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button asChild size="lg" className="group bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20 transition-all text-lg">
              <Link href={dashboardHref} className="flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-slate-300 dark:border-slate-600 text-black dark:text-white font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-lg">
              <Link href={dashboardHref}>Book a Demo</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>

          <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">Trusted by leading companies worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {['TechStartup', 'DesignCo', 'BuildPro', 'ServiceMax', 'CreativeHub'].map((company) => (
                <div key={company} className="text-sm font-semibold">{company}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">WebiBudgets</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Smart budgeting for modern businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#features" className="hover:text-slate-900 dark:hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">© 2024 WebiBudgets. All rights reserved.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 md:mt-0">Made with precision by Webi Studio</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
