import { db } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const now = new Date().toISOString();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { data: monthPayments },
    { data: totalPayments },
    { count: messagesToday },
    { data: planData },
  ] = await Promise.all([
    db.from("User").select("*", { count: "exact", head: true }),
    db.from("Subscription").select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE").gt("expiresAt", now),
    db.from("Payment").select("amount").eq("status", "APPROVED").gte("createdAt", startOfMonth),
    db.from("Payment").select("amount").eq("status", "APPROVED"),
    db.from("Message").select("*", { count: "exact", head: true })
      .eq("direction", "INBOUND").gte("createdAt", startOfDay),
    db.from("Payment").select("plan, amount").eq("status", "APPROVED").gte("createdAt", startOfMonth),
  ]);

  const monthRevenue = (monthPayments ?? []).reduce((acc, p) => acc + p.amount, 0);
  const totalRevenue = (totalPayments ?? []).reduce((acc, p) => acc + p.amount, 0);

  // Group by plan
  const planMap: Record<string, { count: number; total: number }> = {};
  for (const p of planData ?? []) {
    if (!planMap[p.plan]) planMap[p.plan] = { count: 0, total: 0 };
    planMap[p.plan].count++;
    planMap[p.plan].total += p.amount;
  }

  const stats = [
    { label: "Usuários totais",      value: totalUsers ?? 0,                             icon: "👥", color: "text-blue-400" },
    { label: "Assinaturas ativas",   value: activeSubscriptions ?? 0,                    icon: "✅", color: "text-green-400" },
    { label: "Receita este mês",     value: formatCurrency(monthRevenue),                icon: "💰", color: "text-yellow-400" },
    { label: "Receita total",        value: formatCurrency(totalRevenue),                icon: "📈", color: "text-purple-400" },
    { label: "Mensagens hoje",       value: messagesToday ?? 0,                          icon: "💬", color: "text-cyan-400" },
  ];

  const planLabels: Record<string, string> = {
    TRIAL_24H: "Acesso 24h (R$ 9,90)",
    WEEK_7D:   "7 Dias (R$ 19,90)",
    MONTH_30D: "30 Dias (R$ 39,90)",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Visão Geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
        <h2 className="font-bold text-white mb-4">Receita por plano (mês atual)</h2>
        <div className="space-y-3">
          {Object.keys(planMap).length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhum pagamento este mês</p>
          )}
          {Object.entries(planMap).map(([plan, d]) => (
            <div key={plan} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{planLabels[plan] || plan}</p>
                <p className="text-zinc-500 text-sm">{d.count} venda{d.count !== 1 ? "s" : ""}</p>
              </div>
              <p className="text-green-400 font-bold">{formatCurrency(d.total)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
