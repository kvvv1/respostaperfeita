-- ============================================================
-- RESPOSTA PERFEITA — Schema completo para Supabase
-- Cole este arquivo no SQL Editor do Supabase e execute
-- Dashboard → SQL Editor → New query → Cole aqui → Run
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users
CREATE TABLE IF NOT EXISTS "User" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone       TEXT        UNIQUE NOT NULL,
  name        TEXT,
  email       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS "Subscription" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  plan        TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  notified    BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_status_expires
  ON "Subscription" (status, "expiresAt");

-- 4. Payments
CREATE TABLE IF NOT EXISTS "Payment" (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"         TEXT        REFERENCES "User"(id) ON DELETE SET NULL,
  "subscriptionId" TEXT        UNIQUE REFERENCES "Subscription"(id) ON DELETE SET NULL,
  "mpPaymentId"    TEXT        UNIQUE NOT NULL,
  "mpPreferenceId" TEXT,
  status           TEXT        NOT NULL DEFAULT 'PENDING',
  amount           FLOAT       NOT NULL,
  method           TEXT,
  plan             TEXT        NOT NULL,
  "rawWebhook"     TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_mp_id ON "Payment" ("mpPaymentId");

-- 5. Messages
CREATE TABLE IF NOT EXISTS "Message" (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  direction       TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  tokens          INTEGER,
  "zapiMessageId" TEXT        UNIQUE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_message_user_created
  ON "Message" ("userId", "createdAt");

-- 6. Admins
CREATE TABLE IF NOT EXISTS "Admin" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email          TEXT        UNIQUE NOT NULL,
  "passwordHash" TEXT        NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PendingPhone
CREATE TABLE IF NOT EXISTS "PendingPhone" (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "mpPreferenceId" TEXT,
  phone            TEXT,
  plan             TEXT        NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Auto-update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_subscription_updated_at
    BEFORE UPDATE ON "Subscription"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_payment_updated_at
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Row Level Security (service_role bypassa automaticamente)
ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingPhone" ENABLE ROW LEVEL SECURITY;

-- Policies: somente service_role tem acesso total
DO $$ BEGIN
  CREATE POLICY "service_role_all_user"
    ON "User" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_all_subscription"
    ON "Subscription" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_all_payment"
    ON "Payment" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_all_message"
    ON "Message" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_all_admin"
    ON "Admin" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_all_pending"
    ON "PendingPhone" FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Verificação final
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
