import MercadoPagoConfig, { Payment, Preference } from "mercadopago";
import crypto from "crypto";

// ─── SDK client ───────────────────────────────────────────────────────────────
function getClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export const PLANS = {
  TRIAL_24H: { label: "Acesso 24 horas", price: 9.9,  durationHours: 24  },
  WEEK_7D:   { label: "Acesso 7 dias",   price: 19.9, durationHours: 168 },
  MONTH_30D: { label: "Acesso 30 dias",  price: 39.9, durationHours: 720 },
} as const;

export type PlanType = keyof typeof PLANS;

// ─── Create preference ────────────────────────────────────────────────────────
export async function createPreference(plan: PlanType, pendingId: string, requestOrigin?: string) {
  const planData = PLANS[plan];
  const appUrl   = requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.respostaperfeita.com";
  const client   = getClient();
  const pref     = new Preference(client);

  const result = await pref.create({
    body: {
      // Item
      items: [
        {
          id:          plan,
          title:       `Resposta Perfeita — ${planData.label}`,
          description: "Assistente de respostas para WhatsApp com IA",
          quantity:    1,
          unit_price:  planData.price,
          currency_id: "BRL",
        },
      ],

      // CRITICAL: pendingId em external_reference → disponível no webhook
      external_reference: pendingId,

      // Redirect URLs — pendingId vai na query para a página saber o pedido
      back_urls: {
        success: `${appUrl}/obrigado?pendingId=${pendingId}&plan=${plan}`,
        failure: `${appUrl}/?erro=pagamento`,
        pending: `${appUrl}/obrigado?pendingId=${pendingId}&plan=${plan}&status=pending`,
      },
      auto_return: "approved",

      // Webhook do MP
      notification_url: process.env.MP_NOTIFICATION_URL!,

      // Metadata extra
      metadata: { plan, pendingId },

      // Sem parcelamento (produto digital)
      payment_methods: {
        installments: 1,
      },
    },
  });

  return result;
}

// ─── Get payment details ──────────────────────────────────────────────────────
export async function getPaymentById(paymentId: string) {
  const client  = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

// ─── Webhook signature validation ────────────────────────────────────────────
// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip in dev when secret not set

  // Format: ts=...,v1=...
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Manifest string as per MP docs
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hash === v1;
}
