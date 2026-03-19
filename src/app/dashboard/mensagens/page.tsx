import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function MensagensPage() {
  const messages = await db.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { phone: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Mensagens</h1>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Direção</th>
                <th className="text-left px-4 py-3">Mensagem</th>
                <th className="text-left px-4 py-3">Tokens</th>
                <th className="text-left px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                    {msg.user.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        msg.direction === "INBOUND"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {msg.direction === "INBOUND" ? "↓ Recebida" : "↑ Enviada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-xs">
                    <p className="truncate">{msg.content}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{msg.tokens ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(msg.createdAt)}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Nenhuma mensagem ainda
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
