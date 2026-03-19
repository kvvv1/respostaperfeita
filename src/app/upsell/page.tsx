"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { buildWhatsAppLink, getBotPhone } from "@/lib/whatsapp";

function UpsellContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [phone, setPhone] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const queryPhone = searchParams.get("phone") || "";

    if (queryPhone) {
      sessionStorage.setItem("upsellPhone", queryPhone);
      setPhone(queryPhone);
      return;
    }

    const storedPhone = sessionStorage.getItem("upsellPhone") || "";
    if (storedPhone) {
      setPhone(storedPhone);
    }
  }, [searchParams]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  async function handleUpgrade(plan: "WEEK_7D" | "MONTH_30D") {
    if (!phone) {
      alert("Nao encontramos seu WhatsApp. Abra novamente o link de renovacao que enviamos para voce.");
      return;
    }

    setLoading(plan);

    try {
      const res = await fetch("/api/checkout/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, phone }),
      });

      if (!res.ok) {
        throw new Error("Checkout upsell failed");
      }

      const data = await res.json();

      if (!data.initPoint) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.initPoint;
    } catch {
      alert("Nao foi possivel iniciar a compra. Tente novamente em alguns instantes.");
    } finally {
      setLoading(null);
    }
  }

  function skipToBot() {
    window.open(buildWhatsAppLink(getBotPhone()), "_blank");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-lg mx-auto">
        {/* Urgency timer */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center mb-8">
          <p className="text-red-400 text-sm font-semibold">
            ⚡ Oferta especial expira em{" "}
            <span className="font-black text-white">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-3">
            Continue usando{" "}
            <span className="text-green-400">sem limite</span>
          </h1>
          <p className="text-zinc-400">
            Seu acesso atual dura apenas <strong className="text-white">24 horas</strong>.
            Evite perder conversas importantes 👇
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-4 mb-8">
          {/* 7 days */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black">🔹 Plano 7 dias</h2>
                <p className="text-zinc-400 text-sm mt-1">Use o assistente todos os dias</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">R$ 19,90</p>
                <p className="text-zinc-500 text-xs">≈ R$ 2,84/dia</p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade("WEEK_7D")}
              disabled={loading !== null}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading === "WEEK_7D" ? "Aguarde..." : "Quero 7 dias →"}
            </button>
          </div>

          {/* 30 days — highlight */}
          <div className="bg-zinc-900 border-2 border-green-500 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-black px-4 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black">🔥 Plano 30 dias</h2>
                <p className="text-zinc-400 text-sm mt-1">Nunca mais trave em nenhuma conversa</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-green-400">R$ 39,90</p>
                <p className="text-zinc-500 text-xs">≈ R$ 1,33/dia</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {[
                "✔ 30 dias de acesso ilimitado",
                "✔ Até 1000 mensagens por dia",
                "✔ Qualquer contexto: amor, trabalho, conflito",
              ].map((b, i) => (
                <p key={i} className="text-zinc-300 text-sm">{b}</p>
              ))}
            </div>
            <button
              onClick={() => handleUpgrade("MONTH_30D")}
              disabled={loading !== null}
              className="btn-pulse w-full bg-green-500 hover:bg-green-400 text-black font-black text-lg py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading === "MONTH_30D" ? "Aguarde..." : "Quero acesso completo →"}
            </button>
          </div>
        </div>

        {/* Skip to bot */}
        <div className="text-center">
          <button
            onClick={skipToBot}
            className="text-zinc-500 hover:text-zinc-400 text-sm underline"
          >
            Não, obrigado. Vou usar apenas as 24h.
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpsellPage() {
  return (
    <Suspense>
      <UpsellContent />
    </Suspense>
  );
}
