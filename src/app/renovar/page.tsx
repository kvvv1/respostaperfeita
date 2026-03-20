"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLANS = [
  {
    id:    "TRIAL_24H",
    label: "24 horas",
    price: "R$ 9,90",
    per:   "acesso por 1 dia",
    highlight: false,
  },
  {
    id:    "WEEK_7D",
    label: "7 dias",
    price: "R$ 19,90",
    per:   "menos de R$ 3/dia",
    highlight: false,
  },
  {
    id:    "MONTH_30D",
    label: "30 dias",
    price: "R$ 39,90",
    per:   "menos de R$ 1,35/dia",
    highlight: true,
    badge: "melhor custo-benefício",
  },
] as const;

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  // Remove country code 55 for display
  const local = d.startsWith("55") ? d.slice(2) : d;
  if (local.length === 11)
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10)
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
}

function RenovarContent() {
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams          = useSearchParams();

  useEffect(() => {
    const p = searchParams.get("phone") ?? "";
    if (p) setPhone(p);
  }, [searchParams]);

  async function handleSelect(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planId, phone }),
      });

      if (!res.ok) throw new Error("Erro ao criar pagamento");
      const data = await res.json();

      // Store pendingId for /obrigado
      sessionStorage.setItem("pendingId", data.pendingId);
      localStorage.setItem("pendingId", data.pendingId);

      // Redirect to MP checkout
      window.location.href = data.initPoint;
    } catch {
      setLoading(null);
      alert("Erro ao iniciar pagamento. Tente novamente.");
    }
  }

  const displayPhone = phone ? formatPhone(phone) : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-3xl font-black text-white mb-2">Bem-vindo de volta!</h1>
          {displayPhone ? (
            <p className="text-zinc-400">
              Reativando acesso para{" "}
              <span className="text-green-400 font-semibold">{displayPhone}</span>
            </p>
          ) : (
            <p className="text-zinc-400">Escolha seu plano para reativar o acesso</p>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 cursor-pointer transition-all ${
                plan.highlight
                  ? "border-green-500 bg-green-500/5"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              }`}
            >
              {plan.highlight && "badge" in plan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ {plan.badge}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{plan.label}</p>
                  <p className="text-zinc-500 text-sm">{plan.per}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${plan.highlight ? "text-green-400" : "text-white"}`}>
                    {plan.price}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={loading !== null}
                className={`mt-4 w-full font-black py-3 rounded-xl transition-all disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-green-500 hover:bg-green-400 text-white"
                    : "bg-zinc-700 hover:bg-zinc-600 text-white"
                }`}
              >
                {loading === plan.id ? "Aguarde..." : `Reativar por ${plan.price}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          🔒 Pagamento seguro via Mercado Pago · PIX, crédito ou débito
        </p>
      </div>
    </div>
  );
}

export default function RenovarPage() {
  return (
    <Suspense>
      <RenovarContent />
    </Suspense>
  );
}
