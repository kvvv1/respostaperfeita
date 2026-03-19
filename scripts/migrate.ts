/**
 * Script de migração do banco Supabase
 *
 * Uso:
 *   DB_PASSWORD=suasenha npx ts-node --skip-project scripts/migrate.ts
 *
 * OU com Personal Access Token:
 *   SUPABASE_PAT=seutoken npx ts-node --skip-project scripts/migrate.ts
 */

import { Client } from "pg";
import https from "https";

const SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeWdvdmJ4cmlkZ2pmdHN4dmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkyNzU0NiwiZXhwIjoyMDg5NTAzNTQ2fQ.HgbUJRSw8s13ZlVRMxC4kVSwRCLMuVZ63zAvNH2vDBY";

const PROJECT_REF = "wsygovbxridgjftsxvbf";

const MIGRATION_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone       TEXT        UNIQUE NOT NULL,
  name        TEXT,
  email       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
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

-- Payments table
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

CREATE INDEX IF NOT EXISTS idx_payment_mp_id
  ON "Payment" ("mpPaymentId");

-- Messages table
CREATE TABLE IF NOT EXISTS "Message" (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"         TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  direction        TEXT        NOT NULL,
  content          TEXT        NOT NULL,
  tokens           INTEGER,
  "zapiMessageId"  TEXT        UNIQUE,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_user_created
  ON "Message" ("userId", "createdAt");

-- Admins table
CREATE TABLE IF NOT EXISTS "Admin" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email          TEXT        UNIQUE NOT NULL,
  "passwordHash" TEXT        NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PendingPhone table
CREATE TABLE IF NOT EXISTS "PendingPhone" (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "mpPreferenceId" TEXT,
  phone            TEXT,
  plan             TEXT        NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updatedAt trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DO \$\$ BEGIN
  CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END; \$\$;

DO \$\$ BEGIN
  CREATE TRIGGER trg_subscription_updated_at
    BEFORE UPDATE ON "Subscription"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END; \$\$;

DO \$\$ BEGIN
  CREATE TRIGGER trg_payment_updated_at
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END; \$\$;

-- Row Level Security (desabilita para service_role acessar tudo)
ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingPhone" ENABLE ROW LEVEL SECURITY;

-- Policies: somente service_role
CREATE POLICY IF NOT EXISTS "service_role_all_user"         ON "User"         FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all_subscription" ON "Subscription" FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all_payment"      ON "Payment"      FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all_message"      ON "Message"      FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all_admin"        ON "Admin"        FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all_pending"      ON "PendingPhone" FOR ALL TO service_role USING (true);
`;

async function runViaPAT(pat: string) {
  console.log("📡 Tentando via Supabase Management API (PAT)...");

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Management API error: ${JSON.stringify(data)}`);
  }
  console.log("✅ Migração via PAT concluída!", data);
}

async function runViaDirectConnection(password: string) {
  console.log("🔌 Conectando direto ao PostgreSQL...");

  // Try pooler first, then direct
  const configs = [
    {
      host: `aws-0-sa-east-1.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${PROJECT_REF}`,
    },
    {
      host: `db.${PROJECT_REF}.supabase.co`,
      port: 5432,
      user: "postgres",
    },
  ];

  for (const config of configs) {
    console.log(`  → Tentando ${config.host}:${config.port}...`);
    const client = new Client({
      ...config,
      database: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log("  ✅ Conectado!");

      // Run migration in chunks (split by semicolons at top level)
      const statements = MIGRATION_SQL.split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
          process.stdout.write(".");
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("already exists")) {
            process.stdout.write("~");
          } else {
            console.warn(`\n  ⚠️  ${e instanceof Error ? e.message : e}`);
          }
        }
      }

      console.log("\n✅ Migração concluída!");
      await verifySchema(client);
      await client.end();
      return;
    } catch (e: unknown) {
      console.log(`  ✗ Falhou: ${e instanceof Error ? e.message : e}`);
      await client.end().catch(() => {});
    }
  }

  throw new Error("Não foi possível conectar ao banco.");
}

async function verifySchema(client: Client) {
  console.log("\n📋 Verificando schema...\n");

  const { rows } = await client.query(`
    SELECT table_name,
           (SELECT count(*) FROM information_schema.columns c
            WHERE c.table_name = t.table_name
            AND c.table_schema = 'public') as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const expected = ["User", "Subscription", "Payment", "Message", "Admin", "PendingPhone"];

  for (const table of expected) {
    const found = rows.find((r) => r.table_name === table);
    if (found) {
      console.log(`  ✅ "${table}" — ${found.column_count} colunas`);
    } else {
      console.log(`  ❌ "${table}" — NÃO ENCONTRADA`);
    }
  }
}

async function main() {
  const pat = process.env.SUPABASE_PAT;
  const dbPassword = process.env.DB_PASSWORD;

  if (!pat && !dbPassword) {
    console.error(`
❌ Forneça uma das seguintes variáveis:

  DB_PASSWORD=suasenha npx ts-node --skip-project scripts/migrate.ts

  OU

  SUPABASE_PAT=seutoken npx ts-node --skip-project scripts/migrate.ts

Onde pegar:
  - Senha do banco: Supabase Dashboard → Settings → Database
  - PAT: https://supabase.com/dashboard/account/tokens
`);
    process.exit(1);
  }

  try {
    if (pat) {
      await runViaPAT(pat);
    } else if (dbPassword) {
      await runViaDirectConnection(dbPassword);
    }
    console.log("\n🎉 Banco pronto para uso!\n");
  } catch (e) {
    console.error("\n❌ Erro na migração:", e);
    process.exit(1);
  }
}

main();
