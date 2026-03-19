import { db } from "@/lib/supabase";
import { generateResponse } from "@/lib/claude";
import { sendTextMessage } from "@/lib/zapi";
import { getUserByPhone, getActiveSubscription } from "@/services/user.service";
import { formatPhone } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function handleIncomingMessage(
  phone: string,
  messageText: string,
  zapiMessageId?: string
) {
  const formattedPhone = formatPhone(phone);

  // Deduplication check
  if (zapiMessageId) {
    const { data: existing } = await db
      .from("Message")
      .select("id")
      .eq("zapiMessageId", zapiMessageId)
      .single();
    if (existing) return;
  }

  const user = await getUserByPhone(formattedPhone);

  if (!user) {
    await sendTextMessage(
      formattedPhone,
      `Oi! 👋 Para usar o *Resposta Perfeita*, você precisa ativar seu acesso primeiro.\n\n👉 Acesse aqui: ${APP_URL}`
    );
    return;
  }

  const activeSub = await getActiveSubscription(user.id);

  if (!activeSub) {
    await sendTextMessage(
      formattedPhone,
      `Seu acesso expirou 😕\n\nMas calma — você pode ativar novamente agora mesmo!\n\n👉 ${APP_URL}`
    );
    return;
  }

  // Save inbound message
  await db.from("Message").insert({
    userId: user.id,
    direction: "INBOUND",
    content: messageText,
    zapiMessageId: zapiMessageId ?? null,
  });

  // Get recent conversation history (last 6 messages for context)
  const { data: history } = await db
    .from("Message")
    .select("direction, content")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(7);

  const formattedHistory = (history ?? [])
    .reverse()
    .slice(0, -1) // exclude the message we just saved
    .map((m) => ({
      role: (m.direction === "INBOUND" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  // Generate AI response
  const { text, outputTokens } = await generateResponse(messageText, formattedHistory);

  // Save outbound message
  await db.from("Message").insert({
    userId: user.id,
    direction: "OUTBOUND",
    content: text,
    tokens: outputTokens,
  });

  // Send response via WhatsApp
  await sendTextMessage(formattedPhone, text);

  // Check if expiring soon (within 2 hours)
  const hoursLeft =
    (new Date(activeSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursLeft <= 2 && !activeSub.notified) {
    await db
      .from("Subscription")
      .update({ notified: true })
      .eq("id", activeSub.id);

    setTimeout(async () => {
      await sendTextMessage(
        formattedPhone,
        `⚠️ Seu acesso está acabando em menos de 2 horas!\n\nNão perca suas conversas — renove agora 👇\n${APP_URL}/upsell`
      );
    }, 3000);
  }
}
