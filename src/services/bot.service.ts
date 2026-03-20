import { generateResponse, parseClaudeResponse } from "@/lib/claude";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { buildUpsellLink } from "@/lib/whatsapp";
import { sendTextMessage } from "@/lib/zapi";
import {
  getActiveSubscription,
  getUserByPhone,
} from "@/services/user.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.respostaperfeita.com";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendSequence(phone: string, messages: string[]) {
  for (const msg of messages) {
    await sendTextMessage(phone, msg);
    await delay(700);
  }
}

async function isFirstMessage(userId: string): Promise<boolean> {
  const { count } = await db
    .from("Message")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("direction", "OUTBOUND");
  return (count ?? 0) === 0;
}

async function sendOnboarding(phone: string) {
  await sendSequence(phone, [
    `🎉 *Bem-vindo ao Resposta Perfeita!*\n\nSeu acesso está ativo. Sou seu parceiro de comunicação — vou te ajudar a arrasar em qualquer conversa no WhatsApp.`,

    `*Como funcionar comigo é simples:*\n\n📩 Cole aqui a mensagem que você recebeu\nEu identifico o contexto automaticamente e te mando *3 respostas prontas* para copiar e enviar`,

    `*Exemplos do que você pode mandar:*\n\n💘 _"oi sumida, tava com saudade"_ — de um crush\n💼 _"preciso de você amanhã cedo"_ — do chefe\n😤 _"precisamos conversar"_ — do namorado(a)\n💰 _"qual o melhor preço que você faz?"_ — de um cliente\n👥 _"você sumiu, cadê você?"_ — de um amigo`,

    `Além de gerar respostas, você pode:\n\n🧠 Me pedir *conselhos* sobre situações\n💬 Me perguntar *como agir* numa conversa\n📸 Me descrever um *print* e eu te ajudo\n🔄 Pedir para *refazer* qualquer resposta\n\nQuanto menos você precisar explicar, mais rápido eu te ajudo — pode mandar direto!`,

    `*Qual é a primeira mensagem que você quer responder?* 👇\n\nCola aqui e a gente começa!`,
  ]);
}

export async function handleIncomingMessage(
  phone: string,
  messageText: string,
  zapiMessageId?: string,
  imageUrl?: string | null,
  imageCaption?: string
) {
  const formattedPhone = formatPhone(phone);
  console.log(`[BOT] Incoming from ${formattedPhone}: ${messageText.slice(0, 60)}`);

  // Deduplication
  if (zapiMessageId) {
    const { data: existing } = await db
      .from("Message")
      .select("id")
      .eq("zapiMessageId", zapiMessageId)
      .single();
    if (existing) {
      console.log(`[BOT] Duplicate message ${zapiMessageId}, skipping`);
      return;
    }
  }

  const user = await getUserByPhone(formattedPhone);

  if (!user) {
    console.log(`[BOT] No user found for ${formattedPhone}, sending activation message`);
    await sendTextMessage(
      formattedPhone,
      `Oi! 👋 Para usar o *Resposta Perfeita*, você precisa ativar seu acesso primeiro.\n\nAcesse aqui: ${APP_URL}`
    );
    return;
  }

  console.log(`[BOT] User found: ${user.id}`);

  const activeSub = await getActiveSubscription(user.id);

  if (!activeSub) {
    console.log(`[BOT] No active subscription for user ${user.id}`);
    const upsellLink = buildUpsellLink(APP_URL, formattedPhone);
    await sendTextMessage(
      formattedPhone,
      `Seu acesso expirou. 😕\n\nMas calma — você pode reativar agora e continuar usando:\n\n${upsellLink}`
    );
    return;
  }

  console.log(`[BOT] Active subscription found, expires: ${activeSub.expiresAt}`);

  // Save inbound message
  const inboundContent = imageUrl
    ? `[imagem] ${imageCaption || messageText || "print de conversa"}`
    : messageText;

  await db.from("Message").insert({
    userId: user.id,
    direction: "INBOUND",
    content: inboundContent,
    zapiMessageId: zapiMessageId ?? null,
  });

  // Check if first interaction → send onboarding
  const firstTime = await isFirstMessage(user.id);
  if (firstTime) {
    console.log(`[BOT] First message for user ${user.id}, sending onboarding`);
    await sendOnboarding(formattedPhone);

    // Save onboarding as outbound
    await db.from("Message").insert({
      userId: user.id,
      direction: "OUTBOUND",
      content: "[onboarding]",
    });
    return;
  }

  // Fetch conversation history
  const { data: history } = await db
    .from("Message")
    .select("direction, content")
    .eq("userId", user.id)
    .neq("content", "[onboarding]")
    .order("createdAt", { ascending: false })
    .limit(7);

  const formattedHistory = (history ?? [])
    .reverse()
    .slice(0, -1)
    .map((m) => ({
      role: (m.direction === "INBOUND" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  console.log(`[BOT] Calling Claude with ${formattedHistory.length} history messages`);

  // If image, notify user we're processing
  if (imageUrl) {
    await sendTextMessage(formattedPhone, "🔍 Analisando o print... um segundo!");
  }

  const { text, outputTokens } = await generateResponse(messageText, formattedHistory, imageUrl);

  console.log(`[BOT] Claude response (${outputTokens} tokens): ${text.slice(0, 80)}`);

  // Save outbound
  await db.from("Message").insert({
    userId: user.id,
    direction: "OUTBOUND",
    content: text,
    tokens: outputTokens,
  });

  // Send parsed response as separate messages or fallback
  const parsed = parseClaudeResponse(text);
  if (parsed) {
    await sendTextMessage(formattedPhone, `✅ *${parsed.contexto}*`);
    await delay(800);
    await sendTextMessage(formattedPhone, parsed.opcao1);
    await delay(600);
    await sendTextMessage(formattedPhone, parsed.opcao2);
    await delay(600);
    await sendTextMessage(formattedPhone, parsed.opcao3);
    if (parsed.dica) {
      await delay(600);
      await sendTextMessage(formattedPhone, `💡 *Dica:* ${parsed.dica}`);
    }
    await delay(600);
    await sendTextMessage(formattedPhone, `_Segure a mensagem que preferir e toque em *Copiar* para enviar_ 👆`);
  } else {
    await sendTextMessage(formattedPhone, text);
  }

  // Expiry warning
  const hoursLeft =
    (new Date(activeSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursLeft <= 2 && !activeSub.notified) {
    await db
      .from("Subscription")
      .update({ notified: true })
      .eq("id", activeSub.id);

    const upsellLink = buildUpsellLink(APP_URL, formattedPhone);
    setTimeout(async () => {
      await sendTextMessage(
        formattedPhone,
        `⚠️ *Atenção: seu acesso expira em menos de 2 horas!*\n\nAinda tem conversas para resolver? Renove agora e não perde o ritmo:\n\n${upsellLink}\n\n_7 dias por R$ 19,90 · 30 dias por R$ 39,90_`
      );
    }, 3000);
  }
}
