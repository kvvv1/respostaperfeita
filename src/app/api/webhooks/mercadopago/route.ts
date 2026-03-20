import { NextRequest, NextResponse } from "next/server";
import { getPaymentById, validateWebhookSignature, PlanType } from "@/lib/mercadopago";
import { db } from "@/lib/supabase";
import { findOrCreateUser, activateSubscription } from "@/services/user.service";
import { sendWelcomeMessage } from "@/services/notification.service";
import { sendCapiEvent } from "@/lib/meta-capi";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── Signature validation ──────────────────────────────────────────────────
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  let payload: { type?: string; action?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataId = payload.data?.id ? String(payload.data.id) : "";

  // Validate signature when secret is set
  if (xSignature && dataId) {
    const valid = validateWebhookSignature(xSignature, xRequestId, dataId);
    if (!valid) {
      console.warn("MP webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // ── Only process payment events ───────────────────────────────────────────
  const eventType = payload.type || payload.action;
  if (!dataId || (eventType !== "payment" && eventType !== "payment.updated" && eventType !== "payment.created")) {
    return NextResponse.json({ ok: true }); // Ignore other events
  }

  const mpPaymentId = dataId;

  try {
    // Fetch full payment details from MP API
    const mpData = await getPaymentById(mpPaymentId);
    const mpAny  = mpData as unknown as Record<string, unknown>;

    const plan             = ((mpData.metadata?.plan ?? mpAny.metadata) as string | undefined) ?? "TRIAL_24H";
    const externalRef      = mpAny.external_reference as string | undefined;
    const pendingId        = (mpData.metadata?.pendingId as string | undefined) ?? externalRef;
    let   preferenceId     = mpAny.preference_id as string | undefined;

    // If preference_id is missing from MP response, fetch it from PendingPhone
    if (!preferenceId && pendingId) {
      const { data: pp } = await db
        .from("PendingPhone")
        .select("mpPreferenceId")
        .eq("id", pendingId)
        .single();
      preferenceId = pp?.mpPreferenceId ?? undefined;
    }

    // ── Upsert payment record ───────────────────────────────────────────────
    await db.from("Payment").upsert(
      {
        mpPaymentId,
        mpPreferenceId: preferenceId ?? null,
        status:         mpData.status ?? "PENDING",
        amount:         mpData.transaction_amount ?? 0,
        method:         mpData.payment_method_id ?? null,
        plan,
        rawWebhook:     rawBody,
      },
      { onConflict: "mpPaymentId" }
    );

    // ── Only activate on approval ───────────────────────────────────────────
    if (mpData.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // Get phone from PendingPhone via pendingId or external_reference
    let phone: string | undefined;

    if (pendingId) {
      const { data: pending } = await db
        .from("PendingPhone")
        .select("phone")
        .eq("id", pendingId)
        .single();
      phone = pending?.phone ?? undefined;
    }

    // Fallback: phone from MP payer info
    if (!phone && mpData.payer?.phone?.number) {
      phone = String(mpData.payer.phone.number);
    }

    if (!phone) {
      // Payment approved but no phone yet — it will be collected on /obrigado
      // The /api/phone route will activate the subscription when phone is submitted
      console.log(`MP payment ${mpPaymentId} approved — waiting for phone collection`);

      // Mark payment as approved so /api/phone can find it
      await db.from("Payment").update({ status: "APPROVED" }).eq("mpPaymentId", mpPaymentId);
      return NextResponse.json({ ok: true });
    }

    // Activate subscription
    const user = await findOrCreateUser(phone);
    await activateSubscription(
      user.id,
      plan as PlanType,
      mpPaymentId,
      preferenceId,
      mpData.transaction_amount ?? undefined
    );

    try {
      await sendWelcomeMessage(phone, plan);
    } catch (err) {
      console.error("Welcome message failed:", err);
    }

    sendCapiEvent("Purchase", {
      phone,
      value: mpData.transaction_amount ?? undefined,
      currency: "BRL",
      eventId: mpPaymentId,
    }).catch((err) => console.error("CAPI Purchase failed:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error:", err);
    // Always return 200 — MP retries on non-2xx and may create duplicates
    return NextResponse.json({ ok: true });
  }
}
