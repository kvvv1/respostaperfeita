import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// One-time seed endpoint — disable after use in production
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  if (!email || !password) {
    return NextResponse.json({ error: "ADMIN_EMAIL and ADMIN_PASSWORD required" }, { status: 400 });
  }

  const existing = await db.admin.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Admin already exists" });
  }

  const passwordHash = await hashPassword(password);
  await db.admin.create({ data: { email, passwordHash } });

  return NextResponse.json({ success: true, email });
}
