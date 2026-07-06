// scripts/update-mp-plan-prices.js
require('dotenv').config();

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// 👈 Los 3 planes REALES en uso (los mismos IDs que están en tus env vars MP_PLAN_*)
// Cambiá acá el monto nuevo y listo. No toques nada más en este archivo.
const plansToUpdate = [
  {
    label: 'Starter',
    id: process.env.MP_PLAN_STARTER,
    transaction_amount: 990, // 👈 nuevo precio acá
  },
  {
    label: 'Team',
    id: process.env.MP_PLAN_TEAM,
    transaction_amount: 5990, // 👈 nuevo precio acá
  },
  {
    label: 'Business',
    id: process.env.MP_PLAN_BUSINESS,
    transaction_amount: 19990, // 👈 nuevo precio acá
  },
];

async function updatePlanPrices() {
  if (!ACCESS_TOKEN) {
    console.error('❌ Error: MP_ACCESS_TOKEN no está definido.');
    return;
  }

  console.log('💰 Actualizando precios de planes en MercadoPago...\n');

  for (const plan of plansToUpdate) {
    if (!plan.id) {
      console.warn(`⚠️  Salteado "${plan.label}": no hay ID configurado en el .env`);
      continue;
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${plan.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auto_recurring: {
            transaction_amount: plan.transaction_amount,
            currency_id: 'ARS',
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${plan.label} (${plan.id}) → nuevo precio: $${plan.transaction_amount}`);
      } else {
        console.error(`❌ Error en "${plan.label}":`, data);
      }
    } catch (error) {
      console.error(`❌ Error de red en "${plan.label}":`, error);
    }
  }

  console.log(
    '\n⚠️  Recordá: esto solo actualiza lo que se COBRA a nuevos suscriptores.\n' +
      '   No te olvides de actualizar también "price" y "priceARS" en lib/plan.ts\n' +
      '   para que lo que se MUESTRA en /pricing coincida.'
  );
}

updatePlanPrices();