import { db } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const last7d       = new Date(Date.now() - 7  * 86400000).toISOString();
  const last24h      = new Date(Date.now() - 1  * 86400000).toISOString();
  const last30d      = new Date(Date.now() - 30 * 86400000).toISOString();
  const nowIso       = now.toISOString();

  const [
    { count: totalUsers },
    { count: activeSubs },
    { data: monthPayments },
    { data: totalPaymentsAll },
    { count: messagesToday },
    { data: planData },
    { data: activeUsers24h },
    { data: activeUsers7d },
    { data: expiredSubs },
    { data: allPayments },
    { data: topUsers },
    { data: recentPayments },
  ] = await Promise.all([
    db.from("User").select("*", { count: "exact", head: true }),
    db.from("Subscription").select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE").gt("expiresAt", nowIso),
    db.from("Payment").select("amount, plan").eq("status", "APPROVED").gte("createdAt", startOfMonth),
    db.from("Payment").select("amount").eq("status", "APPROVED"),
    db.from("Message").select("*", { count: "exact", head: true })
      .eq("direction", "INBOUND").gte("createdAt", startOfDay),
    db.from("Payment").select("plan, amount").eq("status", "APPROVED").gte("createdAt", startOfMonth),
    // Users who sent a message in the last 24h
    db.from("Message").select("userId").eq("direction", "INBOUND").gte("createdAt", last24h),
    // Users who sent a message in the last 7d
    db.from("Message").select("userId").eq("direction", "INBOUND").gte("createdAt", last7d),
    // Expired subs (last 30d)
    db.from("Subscription").select("userId").eq("status", "EXPIRED").gte("createdAt", last30d),
    // All approved payments (for renewal calc)
    db.from("Payment").select("userId").eq("status", "APPROVED"),
    // Top users by message count (last 30d)
    db.from("Message").select("userId, User(phone)")
      .eq("direction", "INBOUND").gte("createdAt", last30d),
    // Recent payments
    db.from("Payment").select("amount, plan, createdAt, User(phone)")
      .eq("status", "APPROVED").order("createdAt", { ascending: false }).limit(5),
  ]);

  // ── Calcs ────────────────────────────────────────────────────────────────
  const monthRevenue = (monthPayments ?? []).reduce((a, p) => a + p.amount, 0);
  const totalRevenue = (totalPaymentsAll ?? []).reduce((a, p) => a + p.amount, 0);

  // Unique active users
  const activeSet24h = new Set((activeUsers24h ?? []).map(m => m.userId));
  const activeSet7d  = new Set((activeUsers7d  ?? []).map(m => m.userId));

  // Avg messages / active user (7d)
  const msgsPer7d = activeSet7d.size > 0
    ? Math.round((activeUsers7d ?? []).length / activeSet7d.size)
    : 0;

  // Churn rate (30d): expired subs that have NO new payment after expiry
  const expiredUserIds = new Set((expiredSubs ?? []).map(s => s.userId));
  const renewedUserIds = new Set(
    (allPayments ?? []).filter(p => p.userId && expiredUserIds.has(p.userId)).map(p => p.userId)
  );
  const churnedCount  = [...expiredUserIds].filter(id => !renewedUserIds.has(id)).length;
  const churnRate = expiredUserIds.size > 0
    ? Math.round((churnedCount / expiredUserIds.size) * 100)
    : 0;
  const renewalRate = 100 - churnRate;

  // Plan breakdown
  const planMap: Record<string, { count: number; total: number }> = {};
  for (const p of planData ?? []) {
    if (!planMap[p.plan]) planMap[p.plan] = { count: 0, total: 0 };
    planMap[p.plan].count++;
    planMap[p.plan].total += p.amount;
  }
  const totalPlanCount = Object.values(planMap).reduce((a, v) => a + v.count, 0);

  // Top 5 users by message count (30d)
  const userMsgCount: Record<string, { phone: string; count: number }> = {};
  for (const m of topUsers ?? []) {
    const phone = (m.User as { phone?: string } | null)?.phone ?? m.userId;
    if (!userMsgCount[m.userId]) userMsgCount[m.userId] = { phone, count: 0 };
    userMsgCount[m.userId].count++;
  }
  const topFive = Object.values(userMsgCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Revenue last 7 days (group by day)
  const { data: week7Payments } = await db
    .from("Payment").select("amount, createdAt")
    .eq("status", "APPROVED").gte("createdAt", last7d);

  const dayRevenue: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    dayRevenue[key] = 0;
  }
  for (const p of week7Payments ?? []) {
    const key = new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (key in dayRevenue) dayRevenue[key] += p.amount;
  }
  const maxDayRevenue = Math.max(...Object.values(dayRevenue), 1);

  const planLabels: Record<string, string> = {
    TRIAL_24H: "24 horas",
    WEEK_7D:   "7 dias",
    MONTH_30D: "30 dias",
  };
  const planEmoji: Record<string, string> = {
    TRIAL_24H: "⚡",
    WEEK_7D:   "📅",
    MONTH_30D: "🏆",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Visão Geral</h1>

      {/* ── Row 1: KPIs principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita total",      value: formatCurrency(totalRevenue),  icon: "💰", color: "text-yellow-400" },
          { label: "Receita este mês",   value: formatCurrency(monthRevenue),  icon: "📈", color: "text-green-400"  },
          { label: "Usuários totais",    value: totalUsers ?? 0,               icon: "👥", color: "text-blue-400"   },
          { label: "Assinaturas ativas", value: activeSubs ?? 0,               icon: "✅", color: "text-emerald-400"},
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Engajamento + Retenção ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ativos hoje",         value: activeSet24h.size, icon: "🟢", color: "text-green-400",  sub: "usuários com msg" },
          { label: "Ativos 7 dias",       value: activeSet7d.size,  icon: "📊", color: "text-cyan-400",   sub: "usuários únicos"  },
          { label: "Média msgs / usuário",value: msgsPer7d,         icon: "💬", color: "text-purple-400", sub: "últimos 7 dias"   },
          { label: "Mensagens hoje",      value: messagesToday ?? 0,icon: "📨", color: "text-orange-400", sub: "recebidas"        },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
            <p className="text-zinc-700 text-[11px]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 3: Retenção ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-1">Taxa de renovação</h2>
          <p className="text-zinc-500 text-xs mb-4">Dos que expiraram nos últimos 30 dias</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-black text-green-400">{renewalRate}%</p>
              <p className="text-zinc-500 text-xs">renovaram</p>
            </div>
            <div>
              <p className="text-3xl font-black text-red-400">{churnRate}%</p>
              <p className="text-zinc-500 text-xs">saíram ({churnedCount} usuarios)</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${renewalRate}%` }} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-1">Receita por plano</h2>
          <p className="text-zinc-500 text-xs mb-4">Mês atual</p>
          <div className="space-y-2">
            {Object.keys(planMap).length === 0 && (
              <p className="text-zinc-600 text-sm">Nenhuma venda este mês</p>
            )}
            {Object.entries(planMap)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([plan, d]) => {
                const pct = totalPlanCount > 0 ? Math.round((d.count / totalPlanCount) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300">{planEmoji[plan]} {planLabels[plan] ?? plan}</span>
                      <span className="text-zinc-400">{d.count}x · {formatCurrency(d.total)}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Receita 7 dias + Top usuários ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Receita — últimos 7 dias</h2>
          <div className="flex items-end gap-2 h-24">
            {Object.entries(dayRevenue).map(([day, val]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500/80 rounded-t"
                  style={{ height: `${Math.round((val / maxDayRevenue) * 80)}px`, minHeight: val > 0 ? "4px" : "0" }}
                />
                <span className="text-[9px] text-zinc-600">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Usuários mais ativos <span className="text-zinc-500 font-normal text-xs">(30 dias)</span></h2>
          {topFive.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {topFive.map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-xs w-4">{i + 1}.</span>
                    <span className="text-zinc-300 text-sm font-mono">{u.phone}</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-sm">{u.count} msgs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: Pagamentos recentes ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-bold text-white mb-4">Pagamentos recentes</h2>
        <div className="space-y-2">
          {(recentPayments ?? []).map((p, i) => {
            const phone = (p.User as { phone?: string } | null)?.phone ?? "—";
            const date  = new Date(p.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            return (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-zinc-800 last:border-0">
                <span className="text-zinc-400 font-mono">{phone}</span>
                <span className="text-zinc-500">{planEmoji[p.plan]} {planLabels[p.plan] ?? p.plan}</span>
                <span className="text-green-400 font-bold">{formatCurrency(p.amount)}</span>
                <span className="text-zinc-600 text-xs">{date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
