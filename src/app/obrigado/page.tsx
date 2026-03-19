"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ObrigadoContent() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("pendingId") || sessionStorage.getItem("pendingId");
    if (id) setPendingId(id);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pendingId }),
      });

      if (res.ok) {
        setSubmitted(true);
        sessionStorage.removeItem("pendingId");
        // Redirect to upsell after 2 seconds
        setTimeout(() => {
          router.push(`/upsell?phone=${encodeURIComponent(phone)}`);
        }, 2000);
      }
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-black text-green-400 mb-3">Pronto!</h1>
          <p className="text-zinc-400">Aguarde um instante, estamos te redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h1 className="text-3xl font-black text-green-400 mb-2">Acesso liberado!</h1>
          <p className="text-zinc-400">
            Agora informe seu WhatsApp para ativar o assistente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Seu número de WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            required
            className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 mb-4 text-lg"
          />
          <p className="text-zinc-500 text-xs mb-4">
            Vamos te mandar o contato do bot direto no WhatsApp. Sem spam.
          </p>
          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-lg py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Ativando..." : "👉 Ativar meu acesso"}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-sm mt-4">
          🔒 Não vamos usar seu número para nada além do bot
        </p>
      </div>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense>
      <ObrigadoContent />
    </Suspense>
  );
}
