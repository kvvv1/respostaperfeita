import { db } from "@/lib/supabase";
import { buildUpsellLink } from "@/lib/whatsapp";
import { sendTextMessage } from "@/lib/zapi";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendWelcomeMessage(phone: string, plan: string) {
  const planNames: Record<string, string> = {
    TRIAL_24H: "24 horas",
    WEEK_7D: "7 dias",
    MONTH_30D: "30 dias",
  };
  const duration = planNames[plan] || "acesso";

  await sendTextMessage(
    phone,
    `Acesso ativado com sucesso!\n\nSeu plano: ${duration}\n\nMe manda a mensagem ou descreva a situacao que eu te ajudo a responder do jeito certo.\n\nDica: pode colar aqui a mensagem exata que voce recebeu.`
  );
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
        `Seu acesso esta acabando em breve!\n\nNao perca o fio das suas conversas. Continue usando sem interrupcao:\n\n${upsellLink}`
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
          `Seu acesso expirou.\n\nMas voce pode continuar usando agora mesmo:\n\nAtive aqui: ${upsellLink}`
        );
      }
      expiredCount++;
    } catch (err) {
      console.error(`Failed to process expired sub ${sub.id}:`, err);
    }
  }

  return { expiring: expiringCount, expired: expiredCount };
}
