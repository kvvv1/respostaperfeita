import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    activeSubscriptions,
    monthRevenue,
    totalRevenue,
    messagesToday,
    messagesTotal,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
    db.payment.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
    db.message.count({
      where: { direction: "INBOUND", createdAt: { gte: startOfDay } },
    }),
    db.message.count({ where: { direction: "INBOUND" } }),
  ]);

  // Revenue by plan this month
  const planBreakdown = await db.payment.groupBy({
    by: ["plan"],
    where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    messagesToday,
    messagesTotal,
    planBreakdown,
  });
}
