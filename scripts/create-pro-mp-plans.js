// scripts/create-pro-mp-plans.js
require('dotenv').config();

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BACK_URL = 'https://budgets.webistudio.net';

const plansToCreate = [
  {
    envVar: 'MP_PLAN_PRO_MONTHLY',
    reason: "PRO Mensual",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 40000,
      currency_id: "ARS",
    }
  },
  {
    envVar: 'MP_PLAN_PRO_ANNUAL',
    reason: "PRO Anual",
    auto_recurring: {
      frequency: 12,
      frequency_type: "months", // MP no soporta "years" directo, se hace 12 meses de frecuencia
      transaction_amount: 432000,
      currency_id: "ARS",
    }
  },
];

async function createPlans() {
  if (!ACCESS_TOKEN) {
    console.error("❌ Error: MP_ACCESS_TOKEN no está definido.");
    return;
  }

  console.log("🚀 Creando planes PRO (mensual + anual)...\n");

  for (const plan of plansToCreate) {
    try {
      const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: plan.reason,
          auto_recurring: plan.auto_recurring,
          back_url: `${BACK_URL}/dashboard?subscription=success`
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ "${plan.reason}" creado.`);
        console.log(`   Agregá esto a tu .env: ${plan.envVar}="${data.id}"\n`);
      } else {
        console.error(`❌ Error creando "${plan.reason}":`, data);
      }
    } catch (error) {
      console.error(`❌ Error de red:`, error);
    }
  }
}

createPlans();