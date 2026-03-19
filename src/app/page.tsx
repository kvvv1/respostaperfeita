"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TESTIMONIALS = [
  { name: "Ana C.", text: "Usava isso e minha crush respondeu em 3 minutos 😂 funcionou demais", emoji: "💚" },
  { name: "Lucas M.", text: "Tava num conflito com meu chefe e o bot me salvou. Respondi perfeitinho.", emoji: "🔥" },
  { name: "Carla S.", text: "Já uso faz 1 mês, não consigo mais ficar sem. Virou hábito.", emoji: "⭐" },
  { name: "Pedro R.", text: "Fechei uma venda difícil usando as sugestões. Vale muito mais que R$9", emoji: "💰" },
];

const FAQS = [
  {
    q: "Como funciona?",
    a: "Você ativa o acesso, salva o número do bot no WhatsApp, e manda qualquer mensagem que recebeu. O bot responde com 2-3 opções prontas pra você usar.",
  },
  {
    q: "Funciona pra que tipo de situação?",
    a: "Paquera, amizade, trabalho, conflito, venda — qualquer contexto. A IA entende o tom e sugere respostas que soam naturais.",
  },
  {
    q: "Meu acesso é de 24h mesmo?",
    a: "Sim! As 24h começam quando você ativa. Depois você pode renovar por 7 ou 30 dias com desconto.",
  },
  {
    q: "E se eu não gostar?",
    a: "Se o bot não te ajudar na primeira resposta, pode mandar mensagem direto comigo. Resolvemos.",
  },
  {
    q: "O pagamento é seguro?",
    a: "Sim, processamos pelo Mercado Pago — o sistema de pagamentos mais usado do Brasil.",
  },
];

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "TRIAL_24H" }),
      });
      const data = await res.json();

      if (data.initPoint) {
        // Store pendingId in sessionStorage for post-payment flow
        sessionStorage.setItem("pendingId", data.pendingId);
        // Redirect to Mercado Pago
        window.location.href = data.initPoint;
      }
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative flex flex-col items-center text-center px-4 pt-16 pb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
          Bot online agora — ativação em segundos
        </div>

        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 fade-in-up">
          Nunca mais fique sem saber{" "}
          <span className="text-green-400">o que responder</span> no WhatsApp
        </h1>

        <p className="text-lg text-zinc-400 mb-8 max-w-lg fade-in-up">
          Receba respostas prontas, naturais e que funcionam — em segundos.
        </p>

        {/* Chat demo */}
        <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl p-4 mb-8 text-left shadow-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-3 border-b border-zinc-700 pb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">R</div>
            <div>
              <p className="text-sm font-semibold">Resposta Perfeita Bot</p>
              <p className="text-xs text-green-400">● online</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-zinc-800 rounded-xl rounded-tl-none px-3 py-2 w-fit text-zinc-300">
              Você recebeu uma mensagem e não sabe o que responder?
            </div>
            <div className="bg-green-600 rounded-xl rounded-tr-none px-3 py-2 w-fit ml-auto text-white">
              Manda aqui que eu respondo pra você 👀
            </div>
            <div className="bg-zinc-800 rounded-xl rounded-tl-none px-3 py-2 w-fit text-zinc-300">
              &quot;Oi, sumiu né? rsrs&quot;
            </div>
            <div className="bg-green-600 rounded-xl rounded-tr-none px-3 py-2 ml-auto text-white max-w-[220px]">
              <p className="font-semibold mb-1">*Opção 1 (casual):*</p>
              <p>haha tava aqui só na minha, mas agora apareci né 😄</p>
              <p className="font-semibold mt-2 mb-1">*Opção 2 (direto):*</p>
              <p>rs é verdade! mas agora tô aqui 😅 tudo bem?</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBuy}
          disabled={loading}
          className="btn-pulse bg-green-500 hover:bg-green-400 text-black font-black text-lg px-8 py-4 rounded-2xl w-full max-w-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "👉 Ativar acesso agora — R$ 9,90"}
        </button>

        <p className="text-zinc-500 text-sm mt-3">
          🔒 Pagamento seguro via Mercado Pago · PIX ou cartão
        </p>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="bg-zinc-900 border-y border-zinc-800 py-3 px-4">
        <p className="text-center text-zinc-400 text-sm">
          🔥 Mais de <strong className="text-white">1.200 pessoas</strong> já usam o Resposta Perfeita
        </p>
      </div>

      {/* PROBLEMA */}
      <section className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-center mb-8">
          Você também vive isso? 👇
        </h2>
        <div className="grid gap-4">
          {[
            { emoji: "😰", text: "Recebe uma mensagem e fica olhando sem saber o que escrever" },
            { emoji: "⏰", text: "Demora horas pra responder por medo de falar a coisa errada" },
            { emoji: "😬", text: "Manda uma resposta genérica e a conversa morre ali" },
            { emoji: "💔", text: "Perde oportunidade (de paquera, venda ou acordo) por causa disso" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-zinc-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">
            Com o <span className="text-green-400">Resposta Perfeita</span>, isso acaba
          </h2>
          <p className="text-zinc-400 mb-10">
            Nossa IA entende o contexto e sugere exatamente o que falar — com seu tom, natural e eficaz.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Resposta em segundos", desc: "Sem pensar, sem travar. A IA faz o trabalho pesado." },
              { icon: "🎯", title: "Certeiro no contexto", desc: "Paquera, trabalho, conflito — a IA entende a situação." },
              { icon: "🤝", title: "Soa como você", desc: "As respostas são naturais, não robóticas. Parece que foi você." },
            ].map((card, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-zinc-700 rounded-xl p-5 text-left">
                <span className="text-3xl block mb-2">{card.icon}</span>
                <h3 className="font-bold mb-1">{card.title}</h3>
                <p className="text-zinc-400 text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-center mb-10">Como funciona?</h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Pague R$ 9,90", desc: "Pagamento via PIX ou cartão. Aprovação em segundos." },
            { step: "2", title: "Ative seu número", desc: "Informe seu WhatsApp. Vamos mandar o contato do bot pra você." },
            { step: "3", title: "Mande a mensagem", desc: "Cole qualquer mensagem que recebeu e veja as sugestões aparecerem." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500 text-black font-black rounded-full flex items-center justify-center text-lg flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">O que dizem quem usou 👇</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-zinc-700 rounded-xl p-5">
                <p className="text-zinc-300 mb-3">&quot;{t.text}&quot;</p>
                <p className="text-sm font-semibold text-zinc-500">
                  {t.emoji} {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black mb-2">Comece agora por apenas</h2>
        <p className="text-6xl font-black text-green-400 mb-2">R$ 9,90</p>
        <p className="text-zinc-400 mb-6">Acesso completo por 24 horas · Sem assinatura · Cancela quando quiser</p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-6">
          {[
            "✔ Respostas prontas para qualquer situação",
            "✔ Funciona em paquera, trabalho ou conflitos",
            "✔ Sem travar na conversa nunca mais",
            "✔ Ativação em menos de 2 minutos",
          ].map((b, i) => (
            <p key={i} className="text-zinc-300 text-sm">{b}</p>
          ))}
        </div>

        <button
          onClick={handleBuy}
          disabled={loading}
          className="btn-pulse bg-green-500 hover:bg-green-400 text-black font-black text-xl px-10 py-5 rounded-2xl w-full max-w-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "👉 Ativar acesso agora"}
        </button>

        <p className="text-zinc-500 text-sm mt-4">
          🔒 Mercado Pago · PIX liberado na hora
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-zinc-700 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 font-semibold flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className="text-green-400 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-zinc-400 text-sm">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl font-black mb-4">
          Ainda em dúvida? Teste por <span className="text-green-400">R$ 9,90</span> agora.
        </p>
        <p className="text-zinc-400 mb-8">24 horas pra ver se funciona. Sem risco.</p>
        <button
          onClick={handleBuy}
          disabled={loading}
          className="btn-pulse bg-green-500 hover:bg-green-400 text-black font-black text-lg px-8 py-4 rounded-2xl w-full max-w-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "👉 Ativar acesso agora"}
        </button>
      </section>

      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} Resposta Perfeita. Todos os direitos reservados.</p>
        <p className="mt-1">Produto digital — sem garantia de resultado específico.</p>
      </footer>
    </main>
  );
}
