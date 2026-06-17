// scripts/create-mp-plans.js
require('dotenv').config();

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BACK_URL = 'https://budgets.webistudio.net'; 

const plansToCreate = [
  {
    reason: "Plan Básico",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 6990, // 👈 El precio va acá
      currency_id: "ARS",
      type: "recurring" // 👈 Define que es por Checkout Web (Link)
    }
  },
  {
    reason: "Plan Negocio",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 19990,
      currency_id: "ARS",
      type: "recurring"
    }
  },
  {
    reason: "Plan Empresa",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 49990,
      currency_id: "ARS",
      type: "recurring"
    }
  }
];

async function createPlans() {
  if (!ACCESS_TOKEN) {
    console.error("❌ Error: MP_ACCESS_TOKEN no está definido.");
    return;
  }

  console.log("🚀 Generando planes definitivos (Precio + Checkout Web)...");

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
        console.log(`\n   ✅ "${plan.reason}" creado.`);
        console.log(`   👉 ID: ${data.id}`);
      } else {
        console.error(`❌ Error:`, data);
      }
    } catch (error) {
      console.error(`❌ Error de red:`, error);
    }
  }
}

createPlans();