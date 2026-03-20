import { db } from "@/lib/supabase";
import { buildUpsellLink } from "@/lib/whatsapp";
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

export async function checkExpiringSubscriptions() {
  const now = new Date();
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { data: expiring } = await db
    .from("Subscription")
    .select("id, userId, expiresAt, User(phone)")
    .eq("status", "ACTIVE")
    .eq("notified", false)
    .lte("expiresAt", twoHoursFromNow.toISOString())
    .gt("expiresAt", now.toISOString());

  let expiringCount = 0;
  for (const sub of expiring ?? []) {
    const phone = (sub.User as { phone?: string } | null)?.phone;
    if (!phone) continue;

    const upsellLink = buildUpsellLink(APP_URL, phone);

    try {
      await sendTextMessage(
        phone,
        `⏰ *Seu acesso expira em menos de 2 horas!*\n\nVocê ainda tem conversas para resolver? Não deixa travar agora.\n\n👇 Renove em 1 minuto e continue de onde parou:\n${upsellLink}\n\n_7 dias por R$ 19,90 ou 30 dias por R$ 39,90_`
      );
      await db
        .from("Subscription")
        .update({ notified: true })
        .eq("id", sub.id);
      expiringCount++;
    } catch (err) {
      console.error(`Failed to notify expiring sub ${sub.id}:`, err);
    }
  }

  const { data: recentlyExpired } = await db
    .from("Subscription")
    .select("id, userId, User(phone)")
    .eq("status", "ACTIVE")
    .lte("expiresAt", now.toISOString())
    .gte("expiresAt", oneHourAgo.toISOString());

  let expiredCount = 0;
  for (const sub of recentlyExpired ?? []) {
    const phone = (sub.User as { phone?: string } | null)?.phone;
    const upsellLink = phone ? buildUpsellLink(APP_URL, phone) : APP_URL;

    try {
      await db
        .from("Subscription")
        .update({ status: "EXPIRED" })
        .eq("id", sub.id);

      if (phone) {
        await sendTextMessage(
          phone,
          `😕 *Seu acesso expirou.*\n\nSei que ainda tem conversas que precisam de resposta — acontece com todo mundo.\n\nA boa notícia: você pode reativar agora e continuar na hora.\n\n👇 Escolha seu plano:\n${upsellLink}\n\n✅ *7 dias — R$ 19,90* (menos de R$ 3 por dia)\n✅ *30 dias — R$ 39,90* (menos de R$ 1,35 por dia)`
        );
      }
      expiredCount++;
    } catch (err) {
      console.error(`Failed to process expired sub ${sub.id}:`, err);
    }
  }

  return { expiring: expiringCount, expired: expiredCount };
}
