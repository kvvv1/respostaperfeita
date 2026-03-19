import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    await db.pendingPhone.update({
      where: { id: pendingId },
      data: { phone: formattedPhone },
    });

    return NextResponse.json({ success: true, phone: formattedPhone });
  } catch (err) {
    console.error("Phone save error:", err);
    return NextResponse.json({ error: "Erro ao salvar telefone" }, { status: 500 });
  }
}

// Poll endpoint: check if payment is approved and phone is registered
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pendingId = searchParams.get("pendingId");

  if (!pendingId) {
    return NextResponse.json({ error: "pendingId required" }, { status: 400 });
  }

  const pending = await db.pendingPhone.findUnique({ where: { id: pendingId } });

  if (!pending) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if there's a payment for this preference
  const payment = await db.payment.findFirst({
    where: { mpPreferenceId: pending.id, status: "APPROVED" },
    include: { subscription: true },
  });

  return NextResponse.json({
    paid: !!payment,
    phone: pending.phone,
    plan: pending.plan,
  });
}
