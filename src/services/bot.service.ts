import { db } from "@/lib/db";
import { generateResponse } from "@/lib/claude";
import { sendTextMessage, sendLinkMessage } from "@/lib/zapi";
import { getUserByPhone, getActiveSubscription } from "@/services/user.service";
import { formatPhone } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function handleIncomingMessage(
  phone: string,
  messageText: string,
  zapiMessageId?: string
) {
  const formattedPhone = formatPhone(phone);

  // Deduplication
  if (zapiMessageId) {
    const existing = await db.message.findUnique({
      where: { zapiMessageId },
    });
    if (existing) return;
  }

  const user = await getUserByPhone(formattedPhone);

  if (!user) {
    // No user found — not a paying customer
    await sendTextMessage(
      formattedPhone,
      `Oi! 👋 Para usar o *Resposta Perfeita*, você precisa ativar seu acesso primeiro.\n\n👉 Acesse aqui: ${APP_URL}`
    );
    return;
  }

  const activeSub = await getActiveSubscription(user.id);

  if (!activeSub) {
    // Expired
    await sendTextMessage(
      formattedPhone,
      `Seu acesso expirou 😕\n\nMas calma — você pode ativar novamente agora mesmo!\n\n👉 ${APP_URL}/?reativar=1`
    );
    return;
  }

  // Save inbound message
  await db.message.create({
    data: {
      userId: user.id,
      direction: "INBOUND",
      content: messageText,
      zapiMessageId,
    },
  });

  // Get recent conversation history (last 6 messages)
  const history = await db.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const formattedHistory = history
    .reverse()
    .slice(0, -1) // exclude the message we just saved
    .map((m) => ({
      role: (m.direction === "INBOUND" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: m.content,
    }));

  // Generate AI response
  const { text, outputTokens } = await generateResponse(
    messageText,
    formattedHistory
  );

  // Save outbound message
  await db.message.create({
    data: {
      userId: user.id,
      direction: "OUTBOUND",
      content: text,
      tokens: outputTokens,
    },
  });

  // Send response
  await sendTextMessage(formattedPhone, text);

  // Check if expiring soon (within 2 hours) and not yet notified
  const hoursLeft =
    (activeSub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft <= 2 && !activeSub.notified) {
    await db.subscription.update({
      where: { id: activeSub.id },
      data: { notified: true },
    });

    setTimeout(async () => {
      await sendTextMessage(
        formattedPhone,
        `⚠️ Seu acesso está acabando em menos de 2 horas!\n\nNão perca suas conversas — renove agora 👇\n${APP_URL}/upsell`
      );
    }, 3000);
  }
}
