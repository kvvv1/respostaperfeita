import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { findOrCreateUser, activateSubscription } from "@/services/user.service";
import { sendWelcomeMessage } from "@/services/notification.service";
import { PlanType } from "@/lib/mercadopago";
import { sendCapiEvent } from "@/lib/meta-capi";
import { z } from "zod";

const schema = z.object({
  phone:     z.string().min(10),
  pendingId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, pendingId } = schema.parse(body);
    const formattedPhone = formatPhone(phone);

    // Save phone to PendingPhone
    const { error } = await db
      .from("PendingPhone")
      .update({ phone: formattedPhone })
      .eq("id", pendingId);

    if (error) throw new Error(error.message);

    // Check if payment is already approved (webhook may have arrived before phone was entered)
    const { data: pending } = await db
      .from("PendingPhone")
      .select("plan, mpPreferenceId")
      .eq("id", pendingId)
      .single();

    const { data: payment } = await db
      .from("Payment")
      .select("*")
      .eq("mpPreferenceId", pending?.mpPreferenceId ?? "")
      .eq("status", "APPROVED")
      .maybeSingle();

    if (payment && pending) {
      // Payment already approved — activate subscription now
      const user = await findOrCreateUser(formattedPhone);

      // Update payment with userId
      await db.from("Payment").update({ userId: user.id }).eq("id", payment.id);

      await activateSubscription(
        user.id,
        pending.plan as PlanType,
        payment.mpPaymentId,
        payment.mpPreferenceId ?? undefined,
        payment.amount
      );

      try {
        await sendWelcomeMessage(formattedPhone, pending.plan);
      } catch (err) {
        console.error("Welcome message failed:", err);
      }

      sendCapiEvent("Lead", { phone: formattedPhone, eventId: pendingId }).catch(
        (err) => console.error("CAPI Lead failed:", err)
      );

      return NextResponse.json({ success: true, activated: true, phone: formattedPhone });
    }

    return NextResponse.json({ success: true, activated: false, phone: formattedPhone });
  } catch (err) {
    console.error("Phone save error:", err);
    return NextResponse.json({ error: "Erro ao salvar telefone" }, { status: 500 });
  }
}

// Poll: check if payment approved for this pendingId
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pendingId = searchParams.get("pendingId");

  if (!pendingId) {
    return NextResponse.json({ error: "pendingId required" }, { status: 400 });
  }

  const { data: pending } = await db
    .from("PendingPhone")
    .select("*")
    .eq("id", pendingId)
    .single();

  if (!pending) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: payment } = await db
    .from("Payment")
    .select("status")
    .or(`mpPreferenceId.eq.${pendingId},mpPaymentId.eq.${pendingId}`)
    .eq("status", "APPROVED")
    .maybeSingle();

  return NextResponse.json({
    paid:  !!payment,
    phone: pending.phone,
    plan:  pending.plan,
  });
}
