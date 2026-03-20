"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [phone, setPhone] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("pendingId") || sessionStorage.getItem("pendingId");
    if (id) setPendingId(id);
  }, [searchParams]);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(maskPhone(e.target.value));
    setError("");
  }

  function handleConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhoneConfirm(maskPhone(e.target.value));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Digite um número de WhatsApp válido com DDD.");
      return;
    }

    if (phone !== phoneConfirm) {
      setError("Os números não coincidem. Verifique e tente novamente.");
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
        setSubmitted(true);
        sessionStorage.removeItem("pendingId");
        setTimeout(() => {
          router.push(`/upsell?phone=${encodeURIComponent(phone)}`);
        }, 2000);
      } else {
        setError("Erro ao ativar. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const phonesMatch = phone && phoneConfirm && phone === phoneConfirm;
  const phoneValid = isValidPhone(phone);

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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h1 className="text-3xl font-black text-green-400 mb-2">Acesso liberado!</h1>
          <p className="text-zinc-400">
            Informe seu WhatsApp para ativar o assistente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">

          {/* Phone 1 */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Seu número de WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(31) 99999-9999"
              required
              inputMode="numeric"
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
          </div>

          {/* Phone 2 */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Confirme seu número
            </label>
            <input
              type="tel"
              value={phoneConfirm}
              onChange={handleConfirmChange}
              placeholder="(31) 99999-9999"
              required
              inputMode="numeric"
              className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none text-lg transition-colors ${
                phoneConfirm && !phonesMatch
                  ? "border-red-500 focus:border-red-500"
                  : phonesMatch
                  ? "border-green-500 focus:border-green-500"
                  : "border-zinc-600 focus:border-green-500"
              }`}
            />
            {phoneConfirm && !phonesMatch && (
              <p className="text-red-400 text-xs mt-1">Os números não coincidem</p>
            )}
            {phonesMatch && (
              <p className="text-green-400 text-xs mt-1">✓ Números conferem</p>
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
            disabled={loading || !phonesMatch || !phoneValid}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-lg py-4 rounded-xl transition-all disabled:opacity-50"
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
