'use client'

import * as React from 'react'

// Minimal no-op ThemeProvider to disable next-themes and avoid
// client-side mutations of <html> (data-theme / color-scheme).
// This preserves the component API surface for callers but does
// not change DOM attributes — satisfying the MVP requirement
// to remove theme-driven hydration mismatches.
export function ThemeProvider({ children, ..._props }: any) {
  return <>{children}</>
}
