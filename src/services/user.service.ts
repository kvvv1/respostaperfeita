import { db } from "@/lib/db";
import { addHours, formatPhone } from "@/lib/utils";
import { PlanType, PLANS } from "@/lib/mercadopago";

export async function findOrCreateUser(phone: string) {
  const formattedPhone = formatPhone(phone);
  return db.user.upsert({
    where: { phone: formattedPhone },
    create: { phone: formattedPhone },
    update: {},
  });
}

export async function activateSubscription(
  userId: string,
  plan: PlanType,
  mpPaymentId: string,
  mpPreferenceId?: string,
  amount?: number
) {
  const planData = PLANS[plan];
  const expiresAt = addHours(new Date(), planData.durationHours);

  // Expire any active subscription
  await db.subscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  const subscription = await db.subscription.create({
    data: {
      userId,
      plan,
      status: "ACTIVE",
      expiresAt,
    },
  });

  await db.payment.upsert({
    where: { mpPaymentId },
    create: {
      userId,
      subscriptionId: subscription.id,
      mpPaymentId,
      mpPreferenceId,
      status: "APPROVED",
      amount: amount ?? planData.price,
      plan,
    },
    update: {
      status: "APPROVED",
      userId,
      subscriptionId: subscription.id,
    },
  });

  return subscription;
}

export async function getActiveSubscription(userId: string) {
  return db.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });
}

export async function getUserByPhone(phone: string) {
  const formattedPhone = formatPhone(phone);
  return db.user.findUnique({
    where: { phone: formattedPhone },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { expiresAt: "desc" },
        take: 1,
      },
    },
  });
}
