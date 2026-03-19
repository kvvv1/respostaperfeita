/**
 * Script de migração do banco Supabase
 *
 * Uso com senha do banco:
 *   DB_PASSWORD=suasenha node scripts/migrate.js
 *
 * Uso com Personal Access Token:
 *   SUPABASE_PAT=seutoken node scripts/migrate.js
 *
 * Onde pegar:
 *   - Senha: Supabase Dashboard → Settings → Database → Database password
 *   - PAT:   https://supabase.com/dashboard/account/tokens
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const PROJECT_REF = "wsygovbxridgjftsxvbf";
const SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeWdvdmJ4cmlkZ2pmdHN4dmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkyNzU0NiwiZXhwIjoyMDg5NTAzNTQ2fQ.HgbUJRSw8s13ZlVRMxC4kVSwRCLMuVZ63zAvNH2vDBY";

const SQL = fs.readFileSync(
  path.join(__dirname, "schema.sql"),
  "utf-8"
);

async function runViaPAT(pat) {
  console.log("📡 Executando via Supabase Management API (PAT)...");

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Management API: ${JSON.stringify(data)}`);

  console.log("✅ Migração via PAT concluída!");
  return data;
}

async function runViaDirectConnection(password) {
  console.log("🔌 Conectando ao PostgreSQL...");

  const hosts = [
    { host: `aws-0-sa-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${PROJECT_REF}` },
    { host: `db.${PROJECT_REF}.supabase.co`,        port: 5432, user: "postgres" },
  ];

  for (const cfg of hosts) {
    console.log(`  → ${cfg.host}:${cfg.port} (${cfg.user})...`);
    const client = new Client({
      ...cfg,
      database: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log("  ✅ Conectado!\n");

      process.stdout.write("Executando SQL");
      await client.query(SQL);
      console.log("\n✅ Migração concluída!");

      await verifySchema(client);
      await client.end();
      return;
    } catch (e) {
      await client.end().catch(() => {});
      if (e.message.includes("connect")) {
        console.log(`  ✗ Falhou: ${e.message}`);
        continue;
      }
      throw e;
    }
  }

  throw new Error("Não foi possível conectar. Verifique a senha.");
}

async function verifySchema(client) {
  console.log("\n📋 Verificando tabelas criadas:\n");
  const { rows } = await client.query(`
    SELECT table_name,
      (SELECT count(*) FROM information_schema.columns c
       WHERE c.table_name = t.table_name AND c.table_schema = 'public')::int AS cols
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const expected = ["User","Subscription","Payment","Message","Admin","PendingPhone"];
  for (const t of expected) {
    const row = rows.find(r => r.table_name === t);
    console.log(row ? `  ✅  "${t}" — ${row.cols} colunas` : `  ❌  "${t}" — NÃO CRIADA`);
  }
}

async function main() {
  const pat      = process.env.SUPABASE_PAT;
  const password = process.env.DB_PASSWORD;

  if (!pat && !password) {
    console.error(`
❌ Nenhuma credencial fornecida.

  DB_PASSWORD=suasenha node scripts/migrate.js
  SUPABASE_PAT=seutoken node scripts/migrate.js

Onde pegar:
  Senha:  Supabase Dashboard → Settings → Database → Database password
  PAT:    https://supabase.com/dashboard/account/tokens
`);
    process.exit(1);
  }

  try {
    if (pat)      await runViaPAT(pat);
    else          await runViaDirectConnection(password);

    console.log("\n🎉 Banco pronto!\n");
    console.log("  Próximo passo: npm run dev\n");
  } catch (e) {
    console.error("\n❌ Erro:", e.message);
    process.exit(1);
  }
}

main();
