import { NextRequest, NextResponse } from "next/server";
import { getPaymentById, PlanType } from "@/lib/mercadopago";
import { db } from "@/lib/supabase";
import { findOrCreateUser, activateSubscription } from "@/services/user.service";
import { sendWelcomeMessage } from "@/services/notification.service";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: { type: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(payload.data.id);

  try {
    const mpData = await getPaymentById(mpPaymentId);
    const mpAny = mpData as unknown as Record<string, unknown>;

    // Upsert payment record
    await db.from("Payment").upsert(
      {
        mpPaymentId,
        mpPreferenceId: (mpAny.preference_id as string) ?? null,
        status: mpData.status ?? "PENDING",
        amount: mpData.transaction_amount ?? 0,
        method: mpData.payment_method_id ?? null,
        plan: (mpData.metadata?.plan as string) ?? "TRIAL_24H",
        rawWebhook: rawBody,
      },
      { onConflict: "mpPaymentId" }
    );

    if (mpData.status === "approved") {
      const plan = (mpData.metadata?.plan as PlanType) ?? "TRIAL_24H";
      const pendingId = mpData.metadata?.pendingId as string | undefined;

      // Get phone from PendingPhone record
      let phone: string | undefined;
      if (pendingId) {
        const { data: pending } = await db
          .from("PendingPhone")
          .select("phone")
          .eq("id", pendingId)
          .single();
        phone = pending?.phone ?? undefined;
      }

      // Fallback to MP payer phone
      if (!phone && mpData.payer?.phone?.number) {
        phone = String(mpData.payer.phone.number);
      }

      if (phone) {
        const user = await findOrCreateUser(phone);
        await activateSubscription(
          user.id,
          plan,
          mpPaymentId,
          (mpAny.preference_id as string) ?? undefined,
          mpData.transaction_amount ?? undefined
        );

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
