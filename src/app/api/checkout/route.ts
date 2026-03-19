import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["TRIAL_24H", "WEEK_7D", "MONTH_30D"]).default("TRIAL_24H"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { plan } = schema.parse(body);

    // Create a pending record to track this payment session
    const pending = await db.pendingPhone.create({
      data: { plan },
    });

    const preference = await createPreference(plan, pending.id);

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      pendingId: pending.id,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}
