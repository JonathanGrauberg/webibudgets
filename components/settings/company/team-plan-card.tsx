'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, Users, Star } from 'lucide-react'
import { getContrastColor } from '@/lib/contrast'
import { isProPlan } from '@/lib/features' // 👈 nuevo

interface ColorSystem {
  primary: string
  accent: string
}

interface TeamPlanCardProps {
  currentUsers: number
  maxUsers: number
  plan: string
  colors: ColorSystem
}
// 👆 se sacaron currentBudgets/maxBudgets — ya no existen límites de presupuestos por plan

export default function TeamPlanCard({
  currentUsers,
  maxUsers,
  plan,
  colors,
}: TeamPlanCardProps) {
  const isPro = isProPlan(plan) // 👈 reemplaza a isStarter

  const usagePercentUsers = maxUsers > 0 ? Math.min(100, (currentUsers / maxUsers) * 100) : 0
  const isAtLimitUsers = currentUsers >= maxUsers

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
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isPro ? 'PRO' : 'Free'}
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={
              isAtLimitUsers
                ? { backgroundColor: '#fef2f2', color: '#b91c1c' }
                : { backgroundColor: `${colors.accent}15`, color: colors.accent }
            }
          >
            {isAtLimitUsers ? 'Límite' : 'Activo'}
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
        </div>

        <Link
          href="/settings/team"
          className="block w-full py-2.5 rounded-lg font-medium text-center transition-all text-sm"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
            color: getContrastColor(colors.primary),
          }}
        >
          Gestionar Equipo
        </Link>

        {/* 👇 nuevo — solo si no es PRO */}
        {!isPro && (
          <a
            href="mailto:hola@webistudio.net?subject=Quiero%20pasarme%20a%20PRO"
            className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Pasate a PRO
          </a>
        )}
      </div>
    </div>
  )
}