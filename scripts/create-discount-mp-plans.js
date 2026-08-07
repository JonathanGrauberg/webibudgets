// scripts/create-discount-mp-plans.js
require('dotenv').config();
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BACK_URL = 'https://budgets.webistudio.net';

// 👇 agregá acá cualquier nivel nuevo que necesites en el futuro
const tiers = [
  {
    percent: 10,
    monthly: { envVar: 'MP_PLAN_PRO_MONTHLY_10', amount: 36000 },   // 40.000 * 0.9
    annual:  { envVar: 'MP_PLAN_PRO_ANNUAL_10',  amount: 388800 },  // 432.000 * 0.9
  },
  // {
  //   percent: 40, // Black Friday — descomentar y correr cuando haga falta
  //   monthly: { envVar: 'MP_PLAN_PRO_MONTHLY_40', amount: 24000 },  // 40.000 * 0.6
  //   annual:  { envVar: 'MP_PLAN_PRO_ANNUAL_40',  amount: 259200 }, // 432.000 * 0.6
  // },
];

async function createPlan(reason, amount, envVar) {
  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason,
      auto_recurring: {
        frequency: reason.includes('Anual') ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'ARS',
      },
      back_url: `${BACK_URL}/dashboard?subscription=success`,
    }),
  });
  const data = await response.json();
  if (response.ok) {
    console.log(`✅ "${reason}" creado. Agregá al .env: ${envVar}="${data.id}"`);
  } else {
    console.error(`❌ Error con "${reason}":`, data);
  }
}

async function run() {
  for (const tier of tiers) {
    await createPlan(`PRO Mensual -${tier.percent}%`, tier.monthly.amount, tier.monthly.envVar);
    await createPlan(`PRO Anual -${tier.percent}%`, tier.annual.amount, tier.annual.envVar);
  }
}

run();