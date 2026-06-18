//components\settings\company\team-plan-card.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, Users, FileText } from 'lucide-react'
import { getContrastColor } from '@/lib/contrast'

interface ColorSystem {
  primary: string
  accent: string
}

interface TeamPlanCardProps {
  currentUsers: number
  maxUsers: number
  currentBudgets?: number
  maxBudgets?: number
  plan: string
  colors: ColorSystem
}

export default function TeamPlanCard({
  currentUsers,
  maxUsers,
  currentBudgets = 0,
  maxBudgets = 30,
  plan,
  colors,
}: TeamPlanCardProps) {
  const isStarter = plan.toLowerCase() === 'starter'

  // Cálculos de Miembros de Equipo
  const usagePercentUsers = maxUsers > 0 ? Math.min(100, (currentUsers / maxUsers) * 100) : 0
  const isAtLimitUsers = currentUsers >= maxUsers

  // Cálculos de Cotizaciones del mes
  const usagePercentBudgets = maxBudgets > 0 ? Math.min(100, (currentBudgets / maxBudgets) * 100) : 0
  const isAtLimitBudgets = currentBudgets >= maxBudgets

  // Condición global de advertencia
  const isGlobalLimit = isAtLimitUsers || (isStarter && isAtLimitBudgets)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
      />
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
            >
              <Crown className="w-5 h-5" style={{ color: getContrastColor(colors.primary) }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Plan de Equipo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{plan}</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={
              isGlobalLimit
                ? { backgroundColor: '#fef2f2', color: '#b91c1c' }
                : { backgroundColor: `${colors.accent}15`, color: colors.accent }
            }
          >
            {isGlobalLimit ? 'Límite' : 'Activo'}
          </span>
        </div>

        {/* MÉTRICA DE USUARIOS */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Miembros activos</span>
            </div>
            <span className={`font-medium ${isAtLimitUsers ? 'text-red-600' : 'text-slate-900 dark:text-slate-50'}`}>
              {currentUsers} / {maxUsers}
            </span>
          </div>
          <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercentUsers}%` }}
              transition={{ duration: 0.5 }}
              style={{ backgroundColor: isAtLimitUsers ? '#ef4444' : colors.primary }}
            />
          </div>
          {isAtLimitUsers && (
            <p className="text-xs text-red-600">
              Límite alcanzado.{' '}
              <a href="/settings/team" className="underline font-medium">
                Actualizá tu plan
              </a>{' '}
              para agregar más miembros.
            </p>
          )}
        </div>

        {/* MÉTRICA DE PRESUPUESTOS MENSUALES (Solo visible en Starter) */}
        {isStarter && (
          <div className="space-y-3 mb-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400">Presupuestos del mes</span>
              </div>
              <span className={`font-medium ${isAtLimitBudgets ? 'text-red-600' : 'text-slate-900 dark:text-slate-50'}`}>
                {currentBudgets} / {maxBudgets}
              </span>
            </div>
            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${usagePercentBudgets}%` }}
                transition={{ duration: 0.5 }}
                style={{ backgroundColor: isAtLimitBudgets ? '#ef4444' : colors.primary }}
              />
            </div>
            {isAtLimitBudgets && (
              <p className="text-xs text-red-600">
                Llegaste al tope mensual.{' '}
                <a href="/settings/team" className="underline font-medium">
                  Expandí tu plan
                </a>{' '}
                para seguir cotizando este mes.
              </p>
            )}
          </div>
        )}

        <Link
          href="/settings/team"
          className="block w-full py-2.5 rounded-lg font-medium text-center transition-all text-sm"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`, 
            color: getContrastColor(colors.primary) 
          }}
        >
          Gestionar Plan y Equipo
        </Link>
      </div>
    </div>
  )
}