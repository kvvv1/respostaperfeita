import { db } from "@/lib/supabase";
import { addHours, formatPhone } from "@/lib/utils";
import { PlanType, PLANS } from "@/lib/mercadopago";

export async function findOrCreateUser(phone: string) {
  const formattedPhone = formatPhone(phone);

  // Try to find existing user
  const { data: existing } = await db
    .from("User")
    .select("*")
    .eq("phone", formattedPhone)
    .single();

  if (existing) return existing;

  // Create new user
  const { data: created, error } = await db
    .from("User")
    .insert({ phone: formattedPhone })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return created!;
}

export async function activateSubscription(
  userId: string,
  plan: PlanType,
  mpPaymentId: string,
  mpPreferenceId?: string,
  amount?: number
) {
  const planData = PLANS[plan];
  const expiresAt = addHours(new Date(), planData.durationHours).toISOString();

  // Expire any active subscription
  await db
    .from("Subscription")
    .update({ status: "EXPIRED" })
    .eq("userId", userId)
    .eq("status", "ACTIVE");

  // Create new subscription
  const { data: sub, error: subError } = await db
    .from("Subscription")
    .insert({ userId, plan, status: "ACTIVE", expiresAt })
    .select()
    .single();

  if (subError) throw new Error(`Failed to create subscription: ${subError.message}`);

  // Upsert payment
  const { error: payError } = await db.from("Payment").upsert(
    {
      mpPaymentId,
      mpPreferenceId: mpPreferenceId ?? null,
      userId,
      subscriptionId: sub!.id,
      status: "APPROVED",
      amount: amount ?? planData.price,
      plan,
    },
    { onConflict: "mpPaymentId" }
  );

  if (payError) throw new Error(`Failed to upsert payment: ${payError.message}`);

  return sub!;
}

export async function getActiveSubscription(userId: string) {
  const now = new Date().toISOString();
  const { data } = await db
    .from("Subscription")
    .select("*")
    .eq("userId", userId)
    .eq("status", "ACTIVE")
    .gt("expiresAt", now)
    .order("expiresAt", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getUserByPhone(phone: string) {
  const formattedPhone = formatPhone(phone);

  const { data: user } = await db
    .from("User")
    .select("*")
    .eq("phone", formattedPhone)
    .single();

  if (user) return user;

  // Try adding/removing the 9th digit (Brazilian mobile number format)
  let altPhone = formattedPhone;
  if (formattedPhone.length === 12) {
    // 553195531183 → 5531995531183 (add 9 after area code)
    altPhone = formattedPhone.slice(0, 4) + "9" + formattedPhone.slice(4);
  } else if (formattedPhone.length === 13) {
    // 5531995531183 → 553195531183 (remove 9 after area code)
    altPhone = formattedPhone.slice(0, 4) + formattedPhone.slice(5);
  }

  const { data: altUser } = await db
    .from("User")
    .select("*")
    .eq("phone", altPhone)
    .single();

  return altUser;
}
