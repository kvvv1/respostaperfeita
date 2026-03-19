import { db } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function PagamentosPage() {
  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { phone: true } } },
  });

  const statusColor: Record<string, string> = {
    APPROVED: "bg-green-500/20 text-green-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    REJECTED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-zinc-700 text-zinc-400",
  };

  const planLabel: Record<string, string> = {
    TRIAL_24H: "24h",
    WEEK_7D: "7 dias",
    MONTH_30D: "30 dias",
  };

  const totalApproved = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Pagamentos</h1>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
          <p className="text-xs text-zinc-400">Total aprovado (últimos 50)</p>
          <p className="text-lg font-black text-green-400">{formatCurrency(totalApproved)}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Método</th>
                <th className="text-left px-4 py-3">MP ID</th>
                <th className="text-left px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                    {payment.user?.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor[payment.status] ?? "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {planLabel[payment.plan] || payment.plan}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {payment.method || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 text-xs">
                    {payment.mpPaymentId.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum pagamento registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
