import { generateResponse, parseClaudeResponse } from "@/lib/claude";
import { db } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { sendTextMessage } from "@/lib/zapi";
import {
  getActiveSubscription,
  getUserByPhone,
} from "@/services/user.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.respostaperfeita.com";

function renewalLink(phone: string) {
  return `${APP_URL}/renovar?phone=${encodeURIComponent(phone)}`;
}
const DEBOUNCE_MS = 4000; // wait 4s to collect batch of messages

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

export async function sendOnboarding(phone: string) {
  await sendSequence(phone, [
    `🎉 *Bem-vindo ao Resposta Perfeita!*\n\nSeu acesso está ativo. Sou seu parceiro de comunicação — vou te ajudar a arrasar em qualquer conversa no WhatsApp.`,
    `*Como funcionar comigo é simples:*\n\n📩 Cole aqui a mensagem que você recebeu\nEu identifico o contexto automaticamente e te mando *3 respostas prontas* para copiar e enviar`,
    `*Exemplos do que você pode mandar:*\n\n💘 _"oi sumida, tava com saudade"_ — de um crush\n💼 _"preciso de você amanhã cedo"_ — do chefe\n😤 _"precisamos conversar"_ — do namorado(a)\n💰 _"qual o melhor preço que você faz?"_ — de um cliente\n👥 _"você sumiu, cadê você?"_ — de um amigo`,
    `Além de gerar respostas, você pode:\n\n🧠 Me pedir *conselhos* sobre situações\n💬 Me perguntar *como agir* numa conversa\n📸 Mandar um *print* e eu analiso tudo\n📨 Encaminhar *várias mensagens seguidas* para dar contexto — eu leio tudo junto!\n🔄 Pedir para *refazer* qualquer resposta`,
    `*Qual é a primeira mensagem que você quer responder?* 👇`,
  ]);
}

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: hourCount } = await db
    .from("Message")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("direction", "OUTBOUND")
    .gt("createdAt", oneHourAgo);

  const { count: dayCount } = await db
    .from("Message")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("direction", "OUTBOUND")
    .gt("createdAt", oneDayAgo);

  if ((hourCount ?? 0) >= 60) return { allowed: false, reason: "hour" };
  if ((dayCount ?? 0) >= 300) return { allowed: false, reason: "day" };
  return { allowed: true };
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
      console.log(`[BOT] Duplicate ${zapiMessageId}, skipping`);
      return;
    }
  }

  const user = await getUserByPhone(formattedPhone);

  if (!user) {
    await sendTextMessage(
      formattedPhone,
      `Oi! 👋 Você ainda não tem acesso ao *Resposta Perfeita*.\n\nAtive agora por R$ 9,90 e nunca mais trave numa resposta:\n${APP_URL}`
    );
    return;
  }

  const activeSub = await getActiveSubscription(user.id);

  if (!activeSub) {
    await sendTextMessage(
      formattedPhone,
      `Opa, seu acesso expirou. 😕\n\nMas você já sabe como funciona — é só reativar e continuar de onde parou.\n\n👇 Escolha seu plano (tem opção de 24h por R$ 9,90):\n${renewalLink(formattedPhone)}`
    );
    return;
  }

  // Save inbound message
  const inboundContent = imageUrl
    ? `[imagem] ${imageCaption || messageText || "print"}`
    : messageText;

  const { data: savedMsg } = await db
    .from("Message")
    .insert({
      userId: user.id,
      direction: "INBOUND",
      content: inboundContent,
      zapiMessageId: zapiMessageId ?? null,
    })
    .select("id, createdAt")
    .single();

  // Onboarding check
  const firstTime = await isFirstMessage(user.id);
  if (firstTime) {
    await sendOnboarding(formattedPhone);
    await db.from("Message").insert({
      userId: user.id,
      direction: "OUTBOUND",
      content: "[onboarding]",
    });
    return;
  }

  // ── DEBOUNCE: wait for more messages ───────────────────────────────────
  await delay(DEBOUNCE_MS);

  // Find timestamp of last OUTBOUND message
  const { data: lastOut } = await db
    .from("Message")
    .select("createdAt")
    .eq("userId", user.id)
    .eq("direction", "OUTBOUND")
    .neq("content", "[onboarding]")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  const since = lastOut?.createdAt ?? new Date(0).toISOString();

  // Collect all INBOUND messages since last OUTBOUND (the batch)
  const { data: batch } = await db
    .from("Message")
    .select("id, content, createdAt")
    .eq("userId", user.id)
    .eq("direction", "INBOUND")
    .gt("createdAt", since)
    .order("createdAt", { ascending: true });

  if (!batch || batch.length === 0) {
    console.log(`[BOT] Batch empty, already processed`);
    return;
  }

  // Only process if this invocation holds the LATEST message in the batch
  const latestId = batch[batch.length - 1].id;
  if (savedMsg?.id !== latestId) {
    console.log(`[BOT] Not the latest message (${savedMsg?.id} vs ${latestId}), skipping`);
    return;
  }

  console.log(`[BOT] Processing batch of ${batch.length} message(s)`);

  // Rate limiting
  const rateCheck = await checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    const msg = rateCheck.reason === "hour"
      ? "Você atingiu o limite de mensagens por hora. Aguarde alguns minutos antes de continuar. 🙏"
      : "Você atingiu o limite diário de mensagens. Volte amanhã para continuar. 🙏";
    await sendTextMessage(formattedPhone, msg);
    return;
  }

  // Build combined prompt for Claude
  const batchText = batch.length === 1
    ? batch[0].content.replace(/^\[imagem\]\s*/, "")
    : batch.map((m, i) => `[${i + 1}] ${m.content.replace(/^\[imagem\]\s*/, "(print)")}`).join("\n");

  const promptForClaude = batch.length > 1
    ? `O usuário encaminhou ${batch.length} mensagens em sequência para dar contexto. Analise tudo junto como uma única situação:\n\n${batchText}`
    : batchText;

  // Use imageUrl if any message in batch has one (use current if available)
  const hasImage = !!imageUrl && batch.some(m => m.id === savedMsg?.id);

  // Fetch conversation history (excluding current batch)
  const { data: history } = await db
    .from("Message")
    .select("direction, content")
    .eq("userId", user.id)
    .neq("content", "[onboarding]")
    .lt("createdAt", batch[0].createdAt)
    .order("createdAt", { ascending: false })
    .limit(6);

  const formattedHistory = (history ?? [])
    .reverse()
    .map((m) => ({
      role: (m.direction === "INBOUND" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  if (hasImage) {
    await sendTextMessage(formattedPhone, "🔍 Analisando o print... um segundo!");
  } else if (batch.length > 1) {
    await sendTextMessage(formattedPhone, `📨 Recebi ${batch.length} mensagens — analisando tudo junto!`);
  }

  console.log(`[BOT] Calling Claude (batch=${batch.length}, image=${hasImage})`);
  const { text, outputTokens } = await generateResponse(
    promptForClaude,
    formattedHistory,
    hasImage ? imageUrl : null
  );

  await db.from("Message").insert({
    userId: user.id,
    direction: "OUTBOUND",
    content: text,
    tokens: outputTokens,
  });

  // Count previous responses to decide whether to show copy hint
  const { count: responseCount } = await db
    .from("Message")
    .select("id", { count: "exact", head: true })
    .eq("userId", user.id)
    .eq("direction", "OUTBOUND")
    .neq("content", "[onboarding]");

  const parsed = parseClaudeResponse(text);
  if (parsed) {
    await sendTextMessage(
      formattedPhone,
      `✅ *${parsed.contexto}*\n\n💙 carinhosa · ⚡ direta · 🧠 estratégica ↓`
    );
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
    if ((responseCount ?? 0) < 3) {
      await delay(600);
      await sendTextMessage(formattedPhone, `_Segure a mensagem que preferir e toque em *Copiar* para enviar_ 👆`);
    }
  } else {
    await sendTextMessage(formattedPhone, text);
  }

  // Expiry warning
  const hoursLeft =
    (new Date(activeSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursLeft <= 2 && !activeSub.notified) {
    await db.from("Subscription").update({ notified: true }).eq("id", activeSub.id);
    setTimeout(async () => {
      await sendTextMessage(
        formattedPhone,
        `⚠️ *Seu acesso expira em menos de 2 horas!*\n\nNão deixa travar numa hora importante — renove agora em 1 minuto:\n${renewalLink(formattedPhone)}`
      );
    }, 3000);
  }
}
