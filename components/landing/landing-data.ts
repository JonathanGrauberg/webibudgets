export const features = [
  { icon: 'FileText', title: 'Smart Quotation Generation', description: 'Create professional quotations in seconds with intelligent templates and auto-calculations.' },
  { icon: 'Download', title: 'One-Click PDF Export', description: 'Export quotations and invoices as branded PDFs with your company colors and logo.' },
  { icon: 'Users', title: 'Client Management', description: 'Organize and track all your clients in one centralized, easy-to-search database.' },
  { icon: 'Package', title: 'Product Catalog', description: 'Maintain a comprehensive product and service catalog with pricing and descriptions.' },
  { icon: 'Palette', title: 'Brand Customization', description: 'Fully customize colors, fonts, and layouts to match your company brand perfectly.' },
  { icon: 'Share2', title: 'Multi-Tenant Support', description: 'Perfect for agencies managing multiple brands with complete data isolation.' },
]

export const plans = [
  { name: 'Starter', description: 'Perfect for freelancers and small teams', price: '$29', period: '/month', cta: 'Get Started', featured: false, features: ['Up to 50 quotations/month', '5 client profiles', 'Basic templates', 'PDF export', 'Email support', '1 user account'] },
  { name: 'Team', description: 'For growing businesses and agencies', price: '$79', period: '/month', cta: 'Start Free Trial', featured: true, features: ['Unlimited quotations', 'Unlimited clients', 'Advanced templates', 'PDF + branded exports', 'Priority support', 'Up to 5 team members', 'Custom branding', 'Real-time collaboration'] },
  { name: 'Business', description: 'For enterprises with complex needs', price: 'Custom', period: 'pricing', cta: 'Contact Sales', featured: false, features: ['Everything in Team +', 'Unlimited team members', 'Advanced API access', 'White-label solutions', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'Advanced analytics'] },
]

export const testimonials = [
  { name: 'Sarah Chen', role: 'Founder, Design Studio', company: 'Chen Creative', image: 'SC', content: 'WebiBudgets has completely transformed how we handle quotations. Our client response time is down by 60%, and our invoicing is now fully automated. The branding customization is outstanding.', rating: 5 },
  { name: 'Marcus Rodriguez', role: 'Operations Manager', company: 'BuildRight Construction', image: 'MR', content: 'Managing multiple projects and clients used to be a nightmare. Now everything is organized, our team collaborates seamlessly, and we rarely miss a deadline. Highly recommend.', rating: 5 },
  { name: 'Elena Kowalski', role: 'CEO', company: 'Digital Agency Plus', image: 'EK', content: 'The white-label feature is a game-changer for our agency. Our clients love the professional quotations, and we can maintain our brand throughout the entire process. Worth every penny.', rating: 5 },
  { name: 'David Thompson', role: 'Freelance Consultant', company: 'Independent', image: 'DT', content: 'As a solo consultant, this platform handles everything I need. Easy to use, beautiful quotations, and the client portal is fantastic. Customer support is incredibly responsive too.', rating: 5 },
]

export const faqs = [
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.' },
  { question: 'Can I switch plans anytime?', answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate your billing accordingly.' },
  { question: 'Is there a limit to team members?', answer: 'The Starter plan includes 1 user, Team plan includes up to 5 users, and Business plan has unlimited users. Additional users are charged at $10/month each for the Team plan.' },
  { question: 'Do you offer API access?', answer: 'Yes, API access is available on Team and Business plans. This allows you to integrate WebiBudgets with your existing tools and workflows.' },
  { question: 'What happens to my data if I cancel?', answer: 'Your data is yours. If you cancel, you can export all your data in standard formats. We keep it for 30 days in case you want to reactivate.' },
  { question: 'Is there a contract or commitment required?', answer: 'No long-term contracts required. You can cancel anytime with no penalty. We offer month-to-month and annual billing, with a 20% discount on annual plans.' },
]

export const brandSwatches = ['#000000', '#F59E0B', '#3B82F6', '#10B981', '#EF4444']

export const brandStats = [
  { label: 'Happy Customers', value: '2,847' },
  { label: 'Quotations Generated', value: '500K+' },
  { label: 'Revenue Tracked', value: '$125M+' },
]
