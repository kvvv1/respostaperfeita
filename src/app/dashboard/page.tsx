import { formatCurrency } from "@/lib/utils";

async function getStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    cache: "no-store",
    headers: {
      // Server-side fetch doesn't need auth — same process
      Cookie: "",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  // Direct DB query for server component
  const { db } = await import("@/lib/db");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    activeSubscriptions,
    monthRevenue,
    totalRevenue,
    messagesToday,
    planBreakdown,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
    db.payment.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
    db.message.count({
      where: { direction: "INBOUND", createdAt: { gte: startOfDay } },
    }),
    db.payment.groupBy({
      by: ["plan"],
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const stats = [
    { label: "Usuários totais", value: totalUsers, icon: "👥", color: "text-blue-400" },
    { label: "Assinaturas ativas", value: activeSubscriptions, icon: "✅", color: "text-green-400" },
    { label: "Receita este mês", value: formatCurrency(monthRevenue._sum.amount ?? 0), icon: "💰", color: "text-yellow-400" },
    { label: "Receita total", value: formatCurrency(totalRevenue._sum.amount ?? 0), icon: "📈", color: "text-purple-400" },
    { label: "Mensagens hoje", value: messagesToday, icon: "💬", color: "text-cyan-400" },
  ];

  const planLabels: Record<string, string> = {
    TRIAL_24H: "Acesso 24h (R$ 9,90)",
    WEEK_7D: "7 Dias (R$ 19,90)",
    MONTH_30D: "30 Dias (R$ 39,90)",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Visão Geral</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
        <h2 className="font-bold text-white mb-4">Receita por plano (mês atual)</h2>
        <div className="space-y-3">
          {planBreakdown.length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhum pagamento este mês</p>
          )}
          {planBreakdown.map((p) => (
            <div key={p.plan} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{planLabels[p.plan] || p.plan}</p>
                <p className="text-zinc-500 text-sm">{p._count} vendas</p>
              </div>
              <p className="text-green-400 font-bold">
                {formatCurrency(p._sum.amount ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
