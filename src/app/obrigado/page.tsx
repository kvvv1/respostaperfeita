"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase, trackLead } from "@/components/MetaPixel";

const PLAN_PRICES: Record<string, number> = {
  TRIAL_24H: 9.9,
  WEEK_7D:   19.9,
  MONTH_30D: 39.9,
};

const BOT_PHONE = "5531982655571";
const BOT_PHONE_DISPLAY = "(31) 98265-5571";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function ObrigadoContent() {
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [activated, setActivated] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [plan, setPlan]         = useState<string>("TRIAL_24H");
  const [error, setError]       = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const id =
      searchParams.get("pendingId") ||
      sessionStorage.getItem("pendingId") ||
      localStorage.getItem("pendingId");
    if (id) setPendingId(id);

    const p = searchParams.get("plan");
    if (p) setPlan(p);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Digite um número de WhatsApp válido com DDD.");
      return;
    }

    if (!pendingId) {
      setError("Link de ativação inválido. Volte ao e-mail de confirmação.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pendingId }),
      });

      if (res.ok) {
        const price = PLAN_PRICES[plan] ?? 9.9;
        trackPurchase(price);
        trackLead();
        sessionStorage.removeItem("pendingId");
        localStorage.removeItem("pendingId");
        setActivated(true);
      } else {
        setError("Erro ao ativar. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const phoneValid = isValidPhone(phone);

  /* ── Tela de sucesso ── */
  if (activated) {
    const waLink = `https://wa.me/${BOT_PHONE}`;
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-green-400 mb-2">Acesso ativado!</h1>
          <p className="text-zinc-400 mb-8">
            Você vai receber uma mensagem do bot em instantes.<br />
            Adicione o número abaixo na sua agenda agora:
          </p>

          {/* Bot number card */}
          <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center font-black text-white text-sm">
                RP
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Resposta Perfeita Bot</p>
                <p className="text-green-400 font-mono text-lg">{BOT_PHONE_DISPLAY}</p>
              </div>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white font-black text-lg py-4 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.852L.057 23.184a.75.75 0 0 0 .916.916l5.332-1.465A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.732 9.732 0 0 1-4.964-1.355l-.356-.212-3.685 1.013 1.013-3.685-.212-.356A9.732 9.732 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              Abrir no WhatsApp
            </a>
          </div>

          <p className="text-zinc-500 text-sm mb-6">
            Depois de adicionar o contato, mande qualquer mensagem para começar.
          </p>

          <button
            onClick={() => window.location.href = `/upsell?phone=${encodeURIComponent(phone)}`}
            className="text-zinc-600 text-sm underline hover:text-zinc-400 transition-colors"
          >
            Ver planos com desconto →
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Último passo!</h1>
          <p className="text-zinc-400">
            Informe seu WhatsApp para receber o bot
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Seu número de WhatsApp (com DDD)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(maskPhone(e.target.value)); setError(""); }}
              placeholder="(31) 99999-9999"
              required
              inputMode="numeric"
              autoFocus
              className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none text-lg transition-colors ${
                phone && !phoneValid
                  ? "border-red-500 focus:border-red-500"
                  : phone && phoneValid
                  ? "border-green-500 focus:border-green-500"
                  : "border-zinc-600 focus:border-green-500"
              }`}
            />
            {phone && !phoneValid && (
              <p className="text-red-400 text-xs mt-1">Número incompleto — inclua o DDD</p>
            )}
            {phone && phoneValid && (
              <p className="text-green-400 text-xs mt-1">✓ Número válido</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <p className="text-zinc-500 text-xs">
            🔒 Vamos te mandar o contato do bot direto no WhatsApp. Sem spam, nunca.
          </p>

          <button
            type="submit"
            disabled={loading || !phoneValid}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-black text-lg py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Ativando..." : "👉 Ativar meu acesso"}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-sm mt-4">
          Dúvidas? Fale com o suporte direto no WhatsApp
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
