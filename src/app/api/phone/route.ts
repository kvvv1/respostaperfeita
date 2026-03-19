import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10),
  pendingId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, pendingId } = schema.parse(body);
    const formattedPhone = formatPhone(phone);

    const { error } = await db
      .from("PendingPhone")
      .update({ phone: formattedPhone })
      .eq("id", pendingId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, phone: formattedPhone });
  } catch (err) {
    console.error("Phone save error:", err);
    return NextResponse.json({ error: "Erro ao salvar telefone" }, { status: 500 });
  }
}

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
    .select("*, Subscription(*)")
    .eq("mpPreferenceId", pendingId)
    .eq("status", "APPROVED")
    .single();

  return NextResponse.json({
    paid: !!payment,
    phone: pending.phone,
    plan: pending.plan,
  });
}
