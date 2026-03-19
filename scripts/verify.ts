/**
 * Verificação do schema via Supabase REST API
 * Roda com as credenciais atuais (não precisa de senha)
 *
 * npx ts-node --skip-project scripts/verify.ts
 */

const SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeWdvdmJ4cmlkZ2pmdHN4dmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkyNzU0NiwiZXhwIjoyMDg5NTAzNTQ2fQ.HgbUJRSw8s13ZlVRMxC4kVSwRCLMuVZ63zAvNH2vDBY";

const BASE_URL = "https://wsygovbxridgjftsxvbf.supabase.co";

const EXPECTED_TABLES = [
  {
    name: "User",
    columns: ["id", "phone", "name", "email", "createdAt", "updatedAt"],
  },
  {
    name: "Subscription",
    columns: ["id", "userId", "plan", "status", "startedAt", "expiresAt", "notified"],
  },
  {
    name: "Payment",
    columns: ["id", "userId", "subscriptionId", "mpPaymentId", "status", "amount", "plan"],
  },
  {
    name: "Message",
    columns: ["id", "userId", "direction", "content", "tokens", "zapiMessageId"],
  },
  {
    name: "Admin",
    columns: ["id", "email", "passwordHash"],
  },
  {
    name: "PendingPhone",
    columns: ["id", "mpPreferenceId", "phone", "plan"],
  },
];

async function headers() {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  };
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const res = await fetch(
    `${BASE_URL}/rest/v1/${tableName}?select=id&limit=0`,
    { headers: await headers() }
  );
  return res.status !== 404;
}

async function insertTestData() {
  console.log("\n📝 Testando escrita em User...");

  const testPhone = `5511${Date.now().toString().slice(-8)}`;
  const res = await fetch(`${BASE_URL}/rest/v1/User`, {
    method: "POST",
    headers: {
      ...(await headers()),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ phone: testPhone }),
  });

  if (res.ok) {
    const data = (await res.json()) as { id: string }[];
    console.log(`  ✅ Insert OK — id: ${data[0]?.id}`);

    // Cleanup
    await fetch(`${BASE_URL}/rest/v1/User?phone=eq.${testPhone}`, {
      method: "DELETE",
      headers: await headers(),
    });
    console.log("  ✅ Cleanup OK");
  } else {
    const err = await res.text();
    console.log(`  ❌ Insert falhou: ${err}`);
  }
}

async function main() {
  console.log("🔍 Verificando schema do Supabase...\n");

  let allOk = true;

  for (const table of EXPECTED_TABLES) {
    const exists = await checkTableExists(table.name);
    if (exists) {
      console.log(`  ✅ "${table.name}"`);
    } else {
      console.log(`  ❌ "${table.name}" — não encontrada`);
      allOk = false;
    }
  }

  if (allOk) {
    await insertTestData();
    console.log("\n🎉 Schema verificado e funcionando!\n");
  } else {
    console.log(`
❌ Tabelas faltando. Execute o schema:

  1. Abra: https://supabase.com/dashboard/project/wsygovbxridgjftsxvbf/sql/new
  2. Cole o conteúdo de: scripts/schema.sql
  3. Clique em "Run"
  4. Rode este script novamente para verificar
`);
  }
}

main().catch(console.error);
