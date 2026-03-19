import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET() {
  const now = new Date().toISOString();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { data: monthPayments },
    { data: totalPayments },
    { count: messagesToday },
    { data: planBreakdown },
  ] = await Promise.all([
    db.from("User").select("*", { count: "exact", head: true }),
    db.from("Subscription").select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE").gt("expiresAt", now),
    db.from("Payment").select("amount").eq("status", "APPROVED").gte("createdAt", startOfMonth),
    db.from("Payment").select("amount").eq("status", "APPROVED"),
    db.from("Message").select("*", { count: "exact", head: true })
      .eq("direction", "INBOUND").gte("createdAt", startOfDay),
    db.from("Payment").select("plan, amount").eq("status", "APPROVED").gte("createdAt", startOfMonth),
  ]);

  const monthRevenue = (monthPayments ?? []).reduce((acc, p) => acc + p.amount, 0);
  const totalRevenue = (totalPayments ?? []).reduce((acc, p) => acc + p.amount, 0);

  // Group plan breakdown
  const planMap: Record<string, { count: number; total: number }> = {};
  for (const p of planBreakdown ?? []) {
    if (!planMap[p.plan]) planMap[p.plan] = { count: 0, total: 0 };
    planMap[p.plan].count++;
    planMap[p.plan].total += p.amount;
  }

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    monthRevenue,
    totalRevenue,
    messagesToday: messagesToday ?? 0,
    planBreakdown: Object.entries(planMap).map(([plan, d]) => ({
      plan,
      _count: d.count,
      _sum: { amount: d.total },
    })),
  });
}
