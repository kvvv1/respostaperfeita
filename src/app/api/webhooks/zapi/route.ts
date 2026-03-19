import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/services/bot.service";

export async function POST(req: NextRequest) {
  // Validate Z-API client token
  const clientToken = req.headers.get("client-token");
  if (
    process.env.ZAPI_CLIENT_TOKEN &&
    clientToken !== process.env.ZAPI_CLIENT_TOKEN
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ZApiWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignore status updates, group messages, and outbound messages
  if (
    payload.type !== "ReceivedCallback" &&
    payload.type !== "received" &&
    !payload.isStatusReply
  ) {
    return NextResponse.json({ ok: true });
  }

  if (payload.isGroup || payload.fromMe) {
    return NextResponse.json({ ok: true });
  }

  const phone = payload.phone || payload.from?.replace("@s.whatsapp.net", "");
  const messageText = payload.text?.message || payload.body || "";
  const messageId = payload.messageId || payload.id;

  if (!phone || !messageText) {
    return NextResponse.json({ ok: true });
  }

  // Process asynchronously to avoid Z-API timeout
  handleIncomingMessage(phone, messageText, messageId).catch((err) => {
    console.error("Bot handler error:", err);
  });

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
