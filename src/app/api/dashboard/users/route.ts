import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: users, count } = await db
    .from("User")
    .select("*, Subscription(*), Message(count)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  return NextResponse.json({ users: users ?? [], total: count ?? 0, page, limit });
}
