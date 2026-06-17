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
      type: "recurring" // 👈 CLAVE: Define que es una suscripción con checkout de MP
    }
  },
  {
    reason: "Plan Negocio",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      type: "recurring"
    }
  },
  {
    reason: "Plan Empresa",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      type: "recurring"
    }
  }
];

async function createPlans() {
  if (!ACCESS_TOKEN) {
    console.error("❌ Error: MP_ACCESS_TOKEN no está definido.");
    return;
  }

  console.log("🚀 Creando planes compatibles con Checkout público en Mercado Pago...");

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
        console.log(`\n   ✅ "${plan.reason}" creado con éxito.`);
        console.log(`   👉 Reemplazar en tu .env: ${data.id}`);
      } else {
        console.error(`❌ Error en "${plan.reason}":`, data);
      }
    } catch (error) {
      console.error(`❌ Error de red:`, error);
    }
  }
}

createPlans();