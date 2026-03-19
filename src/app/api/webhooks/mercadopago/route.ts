import { NextRequest, NextResponse } from "next/server";
import { getPaymentById } from "@/lib/mercadopago";
import { db } from "@/lib/db";
import { findOrCreateUser, activateSubscription } from "@/services/user.service";
import { sendWelcomeMessage } from "@/services/notification.service";
import { PlanType } from "@/lib/mercadopago";
import crypto from "crypto";

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification in dev

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature) return false;

  const parts = xSignature.split(",");
  const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
  const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!ts || !v1) return false;

  const manifest = `id=${xRequestId};request-id=${xRequestId};ts=${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === v1;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: { type: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process payment events
  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(payload.data.id);

  try {
    const mpData = await getPaymentById(mpPaymentId);

    // Upsert payment record
    await db.payment.upsert({
      where: { mpPaymentId },
      create: {
        mpPaymentId,
        mpPreferenceId: (mpData as unknown as Record<string, string>).preference_id ?? undefined,
        status: mpData.status ?? "PENDING",
        amount: mpData.transaction_amount ?? 0,
        method: mpData.payment_method_id ?? undefined,
        plan: (mpData.metadata?.plan as string) ?? "TRIAL_24H",
        rawWebhook: rawBody,
      },
      update: {
        status: mpData.status ?? "PENDING",
        rawWebhook: rawBody,
      },
    });

    if (mpData.status === "approved") {
      const plan = (mpData.metadata?.plan as PlanType) ?? "TRIAL_24H";
      const pendingId = mpData.metadata?.pendingId as string | undefined;

      // Get phone from pending record if available
      let phone: string | undefined;
      if (pendingId) {
        const pending = await db.pendingPhone.findUnique({
          where: { id: pendingId },
        });
        phone = pending?.phone ?? undefined;
      }

      // Get or set phone from MP payer
      if (!phone && mpData.payer?.phone?.number) {
        phone = String(mpData.payer.phone.number);
      }

      if (phone) {
        const user = await findOrCreateUser(phone);
        await activateSubscription(
          user.id,
          plan,
          mpPaymentId,
          (mpData as unknown as Record<string, string>).preference_id ?? undefined,
          mpData.transaction_amount ?? undefined
        );

        // Send welcome WhatsApp message
        try {
          await sendWelcomeMessage(phone, plan);
        } catch (err) {
          console.error("Failed to send welcome message:", err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}
