import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { handleIncomingMessage } from "@/services/bot.service";

export async function POST(req: NextRequest) {
  let payload: ZApiWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignore outbound messages and group messages
  if (payload.fromMe || payload.isGroup || payload.isStatusReply) {
    return NextResponse.json({ ok: true });
  }

  const phone = payload.phone || payload.from?.replace("@s.whatsapp.net", "");
  const messageText = payload.text?.message || payload.body || "";
  const messageId = payload.messageId || payload.id;

  console.log("ZAPI payload type:", payload.type, "phone:", phone, "text:", messageText?.slice(0, 50));

  if (!phone || !messageText) {
    return NextResponse.json({ ok: true });
  }

  // waitUntil keeps the function alive after response is sent (Vercel Hobby fix)
  waitUntil(
    handleIncomingMessage(phone, messageText, messageId).catch((err) => {
      console.error("Bot handler error:", err);
    })
  );

  return NextResponse.json({ ok: true });
}

interface ZApiWebhookPayload {
  type?: string;
  phone?: string;
  from?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  isStatusReply?: boolean;
  messageId?: string;
  id?: string;
  text?: { message?: string };
  body?: string;
}
