const SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeWdvdmJ4cmlkZ2pmdHN4dmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkyNzU0NiwiZXhwIjoyMDg5NTAzNTQ2fQ.HgbUJRSw8s13ZlVRMxC4kVSwRCLMuVZ63zAvNH2vDBY";

const BASE = "https://wsygovbxridgjftsxvbf.supabase.co";

const TABLES = [
  { name: "User",         cols: ["id","phone","name","email","createdAt","updatedAt"] },
  { name: "Subscription", cols: ["id","userId","plan","status","expiresAt","notified"] },
  { name: "Payment",      cols: ["id","userId","mpPaymentId","status","amount","plan"] },
  { name: "Message",      cols: ["id","userId","direction","content","tokens"] },
  { name: "Admin",        cols: ["id","email","passwordHash"] },
  { name: "PendingPhone", cols: ["id","mpPreferenceId","phone","plan"] },
];

const h = {
  apikey: SERVICE_ROLE,
  Authorization: "Bearer " + SERVICE_ROLE,
  "Content-Type": "application/json",
};

async function checkTable(name) {
  const res = await fetch(`${BASE}/rest/v1/${name}?select=*&limit=0`, { headers: h });
  return { status: res.status, ok: res.status === 200 };
}

async function testInsertDelete() {
  const phone = "55119" + Date.now().toString().slice(-8);
  const res = await fetch(`${BASE}/rest/v1/User`, {
    method: "POST",
    headers: { ...h, Prefer: "return=representation" },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }

  const rows = await res.json();
  const id = rows[0]?.id;

  // Delete test row
  await fetch(`${BASE}/rest/v1/User?phone=eq.${phone}`, {
    method: "DELETE",
    headers: h,
  });

  return { ok: true, id };
}

async function main() {
  console.log("\n🔍 Verificando schema do Supabase...\n");

  let allOk = true;

  for (const t of TABLES) {
    const { ok, status } = await checkTable(t.name);
    const icon = ok ? "✅" : "❌";
    const label = ok ? "OK" : `HTTP ${status}`;
    console.log(`  ${icon}  "${t.name}" — ${label}`);
    if (!ok) allOk = false;
  }

  if (allOk) {
    console.log("\n📝 Testando escrita/leitura...");
    const r = await testInsertDelete();
    if (r.ok) {
      console.log(`  ✅ INSERT + DELETE funcionou (id: ${r.id})`);
      console.log("\n🎉 Schema completo e funcionando!\n");
    } else {
      console.log(`  ❌ Escrita falhou: ${r.error}`);
    }
  } else {
    console.log(`
❌ Tabelas não encontradas. Você precisa criar o schema.

OPÇÃO 1 — SQL Editor (mais fácil):
  1. Acesse: https://supabase.com/dashboard/project/wsygovbxridgjftsxvbf/sql/new
  2. Cole o conteúdo do arquivo: scripts/schema.sql
  3. Clique em "Run"

OPÇÃO 2 — Script com senha do banco:
  DB_PASSWORD=suasenha node scripts/migrate.js

Depois rode: npm run db:verify
`);
    process.exit(1);
  }
}

main().catch(console.error);
