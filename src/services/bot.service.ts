import { generateResponse, parseClaudeResponse } from "@/lib/claude";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { buildUpsellLink } from "@/lib/whatsapp";
import { sendTextMessage } from "@/lib/zapi";
import { getActiveSubscription, getUserByPhone } from "@/services/user.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function handleIncomingMessage(
  phone: string,
  messageText: string,
  zapiMessageId?: string
) {
  const formattedPhone = formatPhone(phone);

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
      `Oi! Para usar o Resposta Perfeita, voce precisa ativar seu acesso primeiro.\n\nAcesse aqui: ${APP_URL}`
    );
    return;
  }

  const activeSub = await getActiveSubscription(user.id);

  if (!activeSub) {
    const upsellLink = buildUpsellLink(APP_URL, formattedPhone);

    await sendTextMessage(
      formattedPhone,
      `Seu acesso expirou.\n\nMas calma, voce pode ativar novamente agora mesmo:\n\n${upsellLink}`
    );
    return;
  }

  await db.from("Message").insert({
    userId: user.id,
    direction: "INBOUND",
    content: messageText,
    zapiMessageId: zapiMessageId ?? null,
  });

  const { data: history } = await db
    .from("Message")
    .select("direction, content")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(7);

  const formattedHistory = (history ?? [])
    .reverse()
    .slice(0, -1)
    .map((message) => ({
      role: (
        message.direction === "INBOUND" ? "user" : "assistant"
      ) as "user" | "assistant",
      content: message.content,
    }));

  const { text, outputTokens } = await generateResponse(
    messageText,
    formattedHistory
  );

  await db.from("Message").insert({
    userId: user.id,
    direction: "OUTBOUND",
    content: text,
    tokens: outputTokens,
  });

  const parsed = parseClaudeResponse(text);

  if (parsed) {
    await sendTextMessage(formattedPhone, `✅ *${parsed.contexto}*`);
    await new Promise((r) => setTimeout(r, 800));
    await sendTextMessage(formattedPhone, `*Opção 1:*\n${parsed.opcao1}`);
    await new Promise((r) => setTimeout(r, 600));
    await sendTextMessage(formattedPhone, `*Opção 2:*\n${parsed.opcao2}`);
    await new Promise((r) => setTimeout(r, 600));
    await sendTextMessage(formattedPhone, `*Opção 3:*\n${parsed.opcao3}`);
    if (parsed.dica) {
      await new Promise((r) => setTimeout(r, 600));
      await sendTextMessage(formattedPhone, `💡 *Dica:* ${parsed.dica}`);
    }
    await new Promise((r) => setTimeout(r, 600));
    await sendTextMessage(formattedPhone, `_Segure qualquer mensagem acima e toque em *Copiar* para enviar_ 👆`);
  } else {
    await sendTextMessage(formattedPhone, text);
  }

  const hoursLeft =
    (new Date(activeSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursLeft <= 2 && !activeSub.notified) {
    const upsellLink = buildUpsellLink(APP_URL, formattedPhone);

    await db
      .from("Subscription")
      .update({ notified: true })
      .eq("id", activeSub.id);

    setTimeout(async () => {
      await sendTextMessage(
        formattedPhone,
        `Seu acesso esta acabando em menos de 2 horas.\n\nNao perca suas conversas. Renove agora:\n${upsellLink}`
      );
    }, 3000);
  }
}
