// scripts/create-mp-plans.js
require('dotenv').config(); 
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BACK_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'; 
const plansToCreate = [
  {
    reason: "Plan Básico",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 6990,
      currency_id: "ARS"
    }
  },
  {
    reason: "Plan Negocio",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 19990,
      currency_id: "ARS"
    }
  },
  {
    reason: "Plan Empresa",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 49990,
      currency_id: "ARS"
    }
  }
];

async function createPlans() {
  if (!ACCESS_TOKEN) {
    console.error("❌ Error: MP_ACCESS_TOKEN no está definido en el .env");
    return;
  }

  console.log("🚀 Iniciando creación de planes en Mercado Pago...");

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
        console.log(`\n   Plan creado con éxito: "${plan.reason}"`);
        console.log(`   👉 ID del Plan (Guardar en tu .env): ${data.id}`);
      } else {
        console.error(`❌ Error al crear "${plan.reason}":`, data);
      }
    } catch (error) {
      console.error(`❌ Error de red en "${plan.reason}":`, error);
    }
  }
}

createPlans();