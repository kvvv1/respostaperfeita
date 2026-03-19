import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: payments, count } = await db
    .from("Payment")
    .select("*, User(phone, name)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  return NextResponse.json({ payments: payments ?? [], total: count ?? 0, page, limit });
}
