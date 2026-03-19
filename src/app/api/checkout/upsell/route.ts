import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  plan:  z.enum(["WEEK_7D", "MONTH_30D"]),
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, phone } = schema.parse(body);
    const formattedPhone = formatPhone(phone);

    // Create pending record for this upsell
    const { data: pending, error } = await db
      .from("PendingPhone")
      .insert({ plan, phone: formattedPhone })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const origin = req.headers.get("origin") ?? undefined;
    const preference = await createPreference(plan, pending!.id, origin);

    return NextResponse.json({
      preferenceId:      preference.id,
      initPoint:         preference.init_point,
      sandboxInitPoint:  preference.sandbox_init_point,
      pendingId:         pending!.id,
      phone:             formattedPhone,
      plan,
    });
  } catch (err) {
    console.error("Upsell checkout error:", err);
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}
