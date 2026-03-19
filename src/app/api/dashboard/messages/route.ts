import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const userId = searchParams.get("userId");

  const skip = (page - 1) * limit;

  const where = userId ? { userId } : {};

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { phone: true, name: true } } },
    }),
    db.message.count({ where }),
  ]);

  return NextResponse.json({ messages, total, page, limit });
}
