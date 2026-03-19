import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE!;

// Admin client — bypasses RLS, use only server-side
export const db = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

// Typed table helpers
export type Tables = {
  User: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
  };
  Subscription: {
    id: string;
    userId: string;
    plan: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    notified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  Payment: {
    id: string;
    userId: string | null;
    subscriptionId: string | null;
    mpPaymentId: string;
    mpPreferenceId: string | null;
    status: string;
    amount: number;
    method: string | null;
    plan: string;
    rawWebhook: string | null;
    createdAt: string;
    updatedAt: string;
  };
  Message: {
    id: string;
    userId: string;
    direction: string;
    content: string;
    tokens: number | null;
    zapiMessageId: string | null;
    createdAt: string;
  };
  Admin: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
  };
  PendingPhone: {
    id: string;
    mpPreferenceId: string | null;
    phone: string | null;
    plan: string;
    createdAt: string;
  };
};
