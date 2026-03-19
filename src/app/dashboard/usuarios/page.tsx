import { db } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export default async function UsuariosPage() {
  const now = new Date().toISOString();

  const { data: users } = await db
    .from("User")
    .select("*, Subscription(*)")
    .order("createdAt", { ascending: false })
    .limit(50);

  const planLabel: Record<string, string> = {
    TRIAL_24H: "24h",
    WEEK_7D:   "7 dias",
    MONTH_30D: "30 dias",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Usuários</h1>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3">WhatsApp</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Expira</th>
                <th className="text-left px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => {
                const subs = (user.Subscription as { status: string; expiresAt: string; plan: string }[] | null) ?? [];
                const sub = subs[0];
                const isActive = sub?.status === "ACTIVE" && sub.expiresAt > now;

                return (
                  <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-300">{user.phone}</td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                          {isActive ? "Ativo" : "Expirado"}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Sem plano</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {sub ? (planLabel[sub.plan] || sub.plan) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {sub ? formatDate(sub.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum usuário cadastrado
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
