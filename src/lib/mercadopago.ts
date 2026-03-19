import MercadoPagoConfig, { Payment, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const mpPreference = new Preference(client);
export const mpPayment = new Payment(client);

export const PLANS = {
  TRIAL_24H: { label: "Acesso 24h", price: 9.9, durationHours: 24 },
  WEEK_7D: { label: "Acesso 7 dias", price: 19.9, durationHours: 168 },
  MONTH_30D: { label: "Acesso 30 dias", price: 39.9, durationHours: 720 },
} as const;

export type PlanType = keyof typeof PLANS;

export async function createPreference(
  plan: PlanType,
  preferenceId?: string
) {
  const planData = PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const preference = await mpPreference.create({
    body: {
      items: [
        {
          id: plan,
          title: `Resposta Perfeita - ${planData.label}`,
          description: "Assistente de respostas para WhatsApp com IA",
          quantity: 1,
          unit_price: planData.price,
          currency_id: "BRL",
        },
      ],
      back_urls: {
        success: `${appUrl}/obrigado?plan=${plan}`,
        failure: `${appUrl}/?erro=pagamento`,
        pending: `${appUrl}/obrigado?plan=${plan}&pending=true`,
      },
      notification_url: process.env.MP_NOTIFICATION_URL!,
      metadata: {
        plan,
        pendingId: preferenceId,
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    },
  });

  return preference;
}

export async function getPaymentById(paymentId: string) {
  return mpPayment.get({ id: paymentId });
}
