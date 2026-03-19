import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const userId = searchParams.get("userId");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("Message")
    .select("*, User(phone, name)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (userId) query = query.eq("userId", userId);

  const { data: messages, count } = await query;

  return NextResponse.json({ messages: messages ?? [], total: count ?? 0, page, limit });
}
