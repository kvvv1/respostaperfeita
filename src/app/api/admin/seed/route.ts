import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  if (!email || !password) {
    return NextResponse.json({ error: "ADMIN_EMAIL and ADMIN_PASSWORD required" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("Admin")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ message: "Admin already exists" });
  }

  const passwordHash = await hashPassword(password);
  const { error } = await db.from("Admin").insert({ email, passwordHash });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}
