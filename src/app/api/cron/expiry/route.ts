import { NextRequest, NextResponse } from "next/server";
import { checkExpiringSubscriptions } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkExpiringSubscriptions();
  return NextResponse.json({ ok: true, ...result });
}
