'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

// Hardcode a fixed theme for notifications. We intentionally avoid
// using `next-themes` so nothing mutates the documentElement.
const Toaster = ({ ...props }: ToasterProps) => {
  const theme: ToasterProps['theme'] = 'light'

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
