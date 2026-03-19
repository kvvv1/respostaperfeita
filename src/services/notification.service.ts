import { db } from "@/lib/db";
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
    `✅ *Acesso ativado com sucesso!*\n\nSeu plano: *${duration}*\n\nBoa 👀\nMe manda a mensagem ou descreva a situação que eu te ajudo a responder do jeito certo!\n\n_Dica: pode colar aqui a mensagem exata que você recebeu._`
  );
}

export async function checkExpiringSubscriptions() {
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const now = new Date();

  // Subscriptions expiring within 2 hours, not yet notified
  const expiring = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: twoHoursFromNow, gt: now },
      notified: false,
    },
    include: { user: true },
  });

  for (const sub of expiring) {
    if (!sub.user.phone) continue;
    try {
      await sendTextMessage(
        sub.user.phone,
        `⚠️ *Seu acesso está acabando em breve!*\n\nNão perca o fio das suas conversas — continue usando sem interrupção 👇\n\n${APP_URL}/upsell`
      );
      await db.subscription.update({
        where: { id: sub.id },
        data: { notified: true },
      });
    } catch (err) {
      console.error(`Failed to notify ${sub.user.phone}:`, err);
    }
  }

  // Subscriptions that just expired (within last 1 hour) — send expired message
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentlyExpired = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now, gte: oneHourAgo },
    },
    include: { user: true },
  });

  for (const sub of recentlyExpired) {
    if (!sub.user.phone) continue;
    try {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });
      await sendTextMessage(
        sub.user.phone,
        `Seu acesso expirou 😕\n\nMas você pode continuar usando agora mesmo!\n\n👉 Ative aqui: ${APP_URL}`
      );
    } catch (err) {
      console.error(`Failed to send expiry to ${sub.user.phone}:`, err);
    }
  }

  return { expiring: expiring.length, recentlyExpired: recentlyExpired.length };
}
