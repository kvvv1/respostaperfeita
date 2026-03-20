import { db } from "@/lib/supabase";
import { sendTextMessage } from "@/lib/zapi";
import { sendOnboarding } from "@/services/bot.service";
import { getUserByPhone } from "@/services/user.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendWelcomeMessage(phone: string, _plan: string) {
  await sendOnboarding(phone);

  // Mark onboarding as sent so bot.service doesn't send it again on first message
  const user = await getUserByPhone(phone);
  if (user) {
    await db.from("Message").insert({
      userId: user.id,
      direction: "OUTBOUND",
      content: "[onboarding]",
    });
  }
}

function renewalLink(phone: string) {
  return `${APP_URL}/renovar?phone=${encodeURIComponent(phone)}`;
}

const PLAN_LABEL: Record<string, string> = {
  TRIAL_24H: "24 horas",
  WEEK_7D:   "7 dias",
  MONTH_30D: "30 dias",
};

export async function checkExpiringSubscriptions() {
  const now           = new Date();
  const in25h         = new Date(Date.now() + 25 * 60 * 60 * 1000);
  const in23h         = new Date(Date.now() + 23 * 60 * 60 * 1000);
  const in2h30        = new Date(Date.now() + 2.5 * 60 * 60 * 1000);
  const in1h30        = new Date(Date.now() + 1.5 * 60 * 60 * 1000);
  const oneHourAgo    = new Date(Date.now() - 60 * 60 * 1000);

  // ── 1. Aviso 24h antes ────────────────────────────────────────────────────
  const { data: expiring24h } = await db
    .from("Subscription")
    .select("id, plan, userId, expiresAt, User(phone)")
    .eq("status", "ACTIVE")
    .eq("notified24h", false)
    .lte("expiresAt", in25h.toISOString())
    .gt("expiresAt", in23h.toISOString());

  let count24h = 0;
  for (const sub of expiring24h ?? []) {
    const phone = (sub.User as { phone?: string } | null)?.phone;
    if (!phone) continue;
    const planLabel = PLAN_LABEL[sub.plan as string] ?? sub.plan;
    try {
      await sendTextMessage(
        phone,
        `⏳ *Seu acesso de ${planLabel} expira amanhã!*\n\nVocê já usou o bot pra resolver suas conversas — imagina ter isso por 30 dias completos.\n\n🏆 *Plano recomendado: 30 dias por R$ 39,90*\nMenos de R$ 1,35 por dia. Você gasta mais num café.\n\n👇 Garanta já e nunca mais trave numa resposta:\n${renewalLink(phone)}\n\n_Também disponível: 7 dias por R$ 19,90_`
      );
      await db.from("Subscription").update({ notified24h: true }).eq("id", sub.id);
      count24h++;
    } catch (err) {
      console.error(`Failed to send 24h notice for sub ${sub.id}:`, err);
    }
  }

  // ── 2. Aviso 2h antes ─────────────────────────────────────────────────────
  const { data: expiring2h } = await db
    .from("Subscription")
    .select("id, plan, userId, expiresAt, User(phone)")
    .eq("status", "ACTIVE")
    .eq("notified", false)
    .lte("expiresAt", in2h30.toISOString())
    .gt("expiresAt", in1h30.toISOString());

  let count2h = 0;
  for (const sub of expiring2h ?? []) {
    const phone = (sub.User as { phone?: string } | null)?.phone;
    if (!phone) continue;
    try {
      await sendTextMessage(
        phone,
        `🚨 *Seu acesso expira em menos de 2 horas!*\n\nNão deixa travar agora — você já sabe como funciona.\n\n🏆 *Recomendo o plano de 30 dias por R$ 39,90*\nVale muito mais que isso no seu dia a dia.\n\n👇 Renove agora em menos de 1 minuto:\n${renewalLink(phone)}`
      );
      await db.from("Subscription").update({ notified: true }).eq("id", sub.id);
      count2h++;
    } catch (err) {
      console.error(`Failed to send 2h notice for sub ${sub.id}:`, err);
    }
  }

  // ── 3. Expirados — marcar e avisar ────────────────────────────────────────
  const { data: recentlyExpired } = await db
    .from("Subscription")
    .select("id, plan, userId, User(phone)")
    .eq("status", "ACTIVE")
    .lte("expiresAt", now.toISOString())
    .gte("expiresAt", oneHourAgo.toISOString());

  let expiredCount = 0;
  for (const sub of recentlyExpired ?? []) {
    const phone = (sub.User as { phone?: string } | null)?.phone;
    try {
      await db.from("Subscription").update({ status: "EXPIRED" }).eq("id", sub.id);
      if (phone) {
        await sendTextMessage(
          phone,
          `😕 *Seu acesso expirou.*\n\nSei que ainda tem conversas esperando resposta — acontece com todo mundo.\n\nA boa notícia: reativar leva menos de 1 minuto e você volta a usar na hora.\n\n🏆 *Melhor custo-benefício: 30 dias por R$ 39,90*\nMenos de R$ 1,35 por dia para nunca mais travar.\n\n👇 Escolha seu plano e reative agora:\n${renewalLink(phone)}\n\n✅ 24h — R$ 9,90\n✅ 7 dias — R$ 19,90\n✅ *30 dias — R$ 39,90* ⭐ mais popular`
        );
      }
      expiredCount++;
    } catch (err) {
      console.error(`Failed to process expired sub ${sub.id}:`, err);
    }
  }

  return { notified24h: count24h, notified2h: count2h, expired: expiredCount };
}
