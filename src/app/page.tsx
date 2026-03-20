"use client";

import { useState, useEffect, useRef } from "react";
import { trackInitiateCheckout } from "@/components/MetaPixel";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Notif {
  id: number;
  name: string;
  action: string;
  time: string;
}

/* ── Data ──────────────────────────────────────────────────────────────── */
const NOTIFS: Notif[] = [
  { id: 1, name: "Matheus F.",   action: "acabou de ativar o acesso",           time: "agora"    },
  { id: 2, name: "Beatriz L.",   action: "respondeu a crush usando o bot 💚",   time: "2 min"    },
  { id: 3, name: "Diego R.",     action: "fechou uma venda com ajuda da IA",    time: "5 min"    },
  { id: 4, name: "Camila S.",    action: "resolveu conflito no trabalho",        time: "8 min"    },
  { id: 5, name: "Rafael T.",    action: "renovou para 30 dias",                time: "12 min"   },
  { id: 6, name: "Juliana P.",   action: "ativou o acesso agora mesmo",         time: "agora"    },
];

const TESTIMONIALS = [
  {
    name: "Ana C.",
    role: "Designer, SP",
    stars: 5,
    text: "Usava isso e minha crush respondeu em 3 minutos 😂 funcionou demais. Parece mágica.",
  },
  {
    name: "Lucas M.",
    role: "Vendedor, RJ",
    stars: 5,
    text: "Tava num conflito com meu chefe e o bot me salvou. Respondi perfeitinho e a situação se resolveu.",
  },
  {
    name: "Carla S.",
    role: "Estudante, MG",
    stars: 5,
    text: "Já uso faz 1 mês, não consigo mais ficar sem. Virou parte da minha rotina no WhatsApp.",
  },
  {
    name: "Pedro R.",
    role: "Empreendedor, RS",
    stars: 5,
    text: "Fechei uma venda difícil usando as sugestões. Vale muito mais que R$9,90. Serio.",
  },
];

const FAQS = [
  {
    q: "Como funciona na prática?",
    a: "Você ativa o acesso, salva o número do bot no WhatsApp, e manda qualquer mensagem que recebeu. O bot responde em segundos com 2-3 opções prontas pra você copiar e usar.",
  },
  {
    q: "Funciona pra que tipo de situação?",
    a: "Paquera, amizade, trabalho, conflito, venda — qualquer contexto. A IA lê o tom da conversa e sugere respostas que soam naturais ao contexto.",
  },
  {
    q: "Meu acesso é de 24h mesmo?",
    a: "Sim! As 24h começam quando você ativa. Depois você pode renovar por 7 ou 30 dias com desconto especial apresentado após o pagamento.",
  },
  {
    q: "Precisa instalar algum app?",
    a: "Não! Funciona direto no seu WhatsApp normal. Você só adiciona o contato do bot e começa a usar.",
  },
  {
    q: "E se eu não gostar?",
    a: "Se o bot não te ajudar na primeira resposta, manda mensagem direto pra gente. A gente resolve.",
  },
  {
    q: "O pagamento é seguro?",
    a: "Sim, processamos pelo Mercado Pago — o sistema de pagamentos mais usado do Brasil. Aceita PIX, crédito e débito.",
  },
];

/* ── Chat Demo ─────────────────────────────────────────────────────────── */
const CHAT_STEPS = [
  { from: "them", text: "oi, sumiu né? rsrs" },
  { from: "me",   text: "mandei pro bot ↗️" },
  { from: "bot",  text: "✅ Opção 1 (casual):\nhaha tava aqui só na minha, mas agora apareci 😄\n\n✅ Opção 2 (direto):\nrs é verdade! agora tô aqui 😅 tudo bem?" },
  { from: "them", text: "haha oi! tudo ótimo 😍" },
];

function ChatDemo() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= CHAT_STEPS.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 1400);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const restart = setInterval(() => setVisible(0), 12000);
    return () => clearInterval(restart);
  }, []);

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-[var(--bg-card)] shadow-2xl mx-auto">
      {/* WA header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a2a1a] border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center font-black text-black text-sm flex-shrink-0">
          RP
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">Resposta Perfeita Bot</p>
          <p className="text-[11px] text-green-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block blink" />
            online agora
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[200px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIyMjIyMiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        {CHAT_STEPS.slice(0, visible).map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "me" || msg.from === "bot" ? "justify-end" : "justify-start"} animate-[fadeIn_0.3s_ease-out]`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-line ${
                msg.from === "them"
                  ? "bg-[#2a2a2a] text-zinc-300 rounded-tl-none"
                  : msg.from === "me"
                  ? "bg-zinc-700 text-zinc-300 rounded-tr-none"
                  : "bg-green-600/90 text-white rounded-tr-none"
              }`}
            >
              {msg.from === "bot" && (
                <span className="block text-[10px] text-green-200 font-semibold mb-1 uppercase tracking-wide">
                  IA sugeriu:
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {visible < CHAT_STEPS.length && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] rounded-2xl rounded-tl-none px-4 py-2.5">
              <span className="flex gap-1 items-center">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Social Proof Toast ────────────────────────────────────────────────── */
function LiveNotification() {
  const [current, setCurrent] = useState<Notif | null>(null);
  const [visible, setVisible] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    const show = () => {
      setCurrent(NOTIFS[idx.current % NOTIFS.length]);
      idx.current++;
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };

    const t = setTimeout(show, 3000);
    const interval = setInterval(show, 7000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 z-50 max-w-[280px] bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl transition-all duration-400 ${
        visible ? "notif-in" : "notif-out pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs font-bold text-green-400 flex-shrink-0">
          {current.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white leading-snug">{current.name}</p>
          <p className="text-xs text-zinc-400 leading-snug truncate">{current.action}</p>
        </div>
        <span className="text-[10px] text-zinc-600 flex-shrink-0">{current.time}</span>
      </div>
    </div>
  );
}

/* ── Stars ─────────────────────────────────────────────────────────────── */
function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleBuy() {
    setLoading(true);
    trackInitiateCheckout(9.90);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "TRIAL_24H" }),
      });
      const data = await res.json();
      if (data.initPoint) {
        sessionStorage.setItem("pendingId", data.pendingId);
        window.location.href = data.initPoint;
      }
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const BuyBtn = ({ size = "lg", label }: { size?: "lg" | "xl"; label?: string }) => (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`btn-pulse relative overflow-hidden bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-black rounded-2xl transition-all duration-200 disabled:opacity-60 w-full ${
        size === "xl"
          ? "text-xl px-10 py-5 max-w-sm"
          : "text-lg px-8 py-4 max-w-sm"
      }`}
    >
      <span className="relative z-10">
        {loading ? "Aguardando..." : (label ?? "👉 Ativar acesso — R$ 9,90")}
      </span>
    </button>
  );

  return (
    <>
      <LiveNotification />

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#080808]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-white text-lg">
            Resposta<span className="text-green-400">Perfeita</span>
          </span>
          <button
            onClick={handleBuy}
            disabled={loading}
            className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-4 py-2 rounded-xl transition-all duration-200 hidden sm:block"
          >
            {loading ? "..." : "Ativar por R$ 9,90"}
          </button>
        </div>
      </header>

      <main className="overflow-x-hidden">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative pt-16 pb-12 px-4">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-8 fade-up">
              <span className="w-2 h-2 bg-green-400 rounded-full blink" />
              Bot online agora · +3.800 pessoas usando agora
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-5 fade-up-delay">
              Nunca mais trave em uma{" "}
              <span className="gradient-text">conversa</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-xl mx-auto fade-up-delay2">
              Nossa IA lê a mensagem que você recebeu e gera{" "}
              <span className="text-white font-semibold">respostas prontas e naturais</span>{" "}
              em segundos — pra paquera, trabalho ou conflito.
            </p>

            {/* Chat Demo */}
            <div className="mb-10 float fade-up-delay2">
              <ChatDemo />
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3 fade-up-delay2">
              <BuyBtn size="xl" />
              <div className="flex items-center gap-4 text-zinc-500 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Mercado Pago
                </span>
                <span>·</span>
                <span>PIX ou cartão</span>
                <span>·</span>
                <span>Ativa em 2 min</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ──────────────────────────────────────────── */}
        <div className="border-y border-white/5 bg-[var(--bg-card)] py-4 px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full blink" />
              <span className="text-green-400 font-bold">3.847</span> usando agora
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <span className="text-green-400 font-bold">+12.000</span> conversas respondidas hoje
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <span className="text-green-400 font-bold">4.8★</span> avaliação média
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <span className="text-green-400 font-bold">98%</span> recomendam
            </span>
          </div>
        </div>

        {/* ── PROBLEMA ──────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">O problema</p>
            <h2 className="text-3xl sm:text-4xl font-black">
              Você já ficou assim? 👇
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { emoji: "😰", title: "Trava na hora de responder", desc: "Fica olhando pra mensagem por minutos sem saber o que escrever" },
              { emoji: "⏰", title: "Demora horas pensando", desc: "Pensa muito por medo de falar a coisa errada e estragar tudo" },
              { emoji: "😬", title: "Resposta genérica que mata a conversa", desc: "Manda um 'haha' ou 'tá bom' e a conversa morre ali" },
              { emoji: "💔", title: "Perde oportunidades reais", desc: "Deixa escapar paquera, venda ou acordo por não saber responder" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-[var(--bg-card)] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
              >
                <span className="text-3xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SOLUÇÃO ───────────────────────────────────────────────────── */}
        <section className="bg-[var(--bg-card)] border-y border-white/5 py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">A solução</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Com o <span className="gradient-text">Resposta Perfeita</span>,{" "}
              isso acaba
            </h2>
            <p className="text-zinc-400 mb-14 max-w-lg mx-auto">
              Nossa IA entende o contexto e sugere exatamente o que falar — com seu tom, natural e eficaz.
            </p>

            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: (
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: "Resposta em segundos",
                  desc: "Sem pensar, sem travar. A IA faz o trabalho pesado enquanto você mantém a conversa fluindo.",
                },
                {
                  icon: (
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Certeiro no contexto",
                  desc: "Paquera, trabalho ou conflito — a IA lê o tom e entende a situação sem você precisar explicar.",
                },
                {
                  icon: (
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  ),
                  title: "Soa como você",
                  desc: "As respostas são naturais, não robóticas. Quem receber vai pensar que foi você mesmo que escreveu.",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="glow-card bg-[var(--bg-card2)] rounded-2xl p-6 text-left hover:scale-[1.02] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-black">Como funciona?</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Pague R$ 9,90",
                  desc: "Pagamento via PIX ou cartão pelo Mercado Pago. Aprovação instantânea.",
                  badge: "2 min",
                },
                {
                  step: "2",
                  title: "Informe seu WhatsApp",
                  desc: "Enviamos o contato do bot direto pra você. Só adicionar e pronto.",
                  badge: "1 min",
                },
                {
                  step: "3",
                  title: "Mande a mensagem recebida",
                  desc: "Cole qualquer mensagem que travou você. O bot responde com 2-3 opções prontas pra copiar.",
                  badge: "segundos",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 text-black font-black rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-green-500/25">
                      {item.step}
                    </div>
                  </div>
                  <div className="pt-1 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ───────────────────────────────────────────────── */}
        <section className="bg-[var(--bg-card)] border-y border-white/5 py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Depoimentos</p>
              <h2 className="text-3xl sm:text-4xl font-black">O que dizem quem usou</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="bg-[var(--bg-card2)] border border-white/5 rounded-2xl p-6 hover:border-green-500/20 transition-colors"
                >
                  <Stars n={t.stars} />
                  <p className="text-zinc-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-sm font-bold text-green-400">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OFERTA / PRICING ──────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Preço</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-2">
            Comece agora sem risco
          </h2>
          <p className="text-zinc-400 mb-12">24 horas pra testar tudo. Se gostar, renova com desconto.</p>

          {/* Price card */}
          <div className="glow-card bg-[var(--bg-card)] rounded-3xl p-8 max-w-sm mx-auto mb-8">
            <p className="text-zinc-400 text-sm mb-1">Acesso Trial</p>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-zinc-500">R$</span>
              <span className="text-7xl font-black text-white leading-none">9</span>
              <span className="text-4xl font-black text-white leading-none mb-1">,90</span>
            </div>
            <p className="text-zinc-500 text-sm mb-6">por 24 horas completas</p>

            <ul className="space-y-3 text-left mb-8">
              {[
                "Respostas prontas para qualquer situação",
                "Paquera, trabalho, conflito — tudo cobre",
                "Histórico da conversa inteligente",
                "2-3 opções de resposta por mensagem",
                "Ativação em menos de 2 minutos",
                "Sem assinatura, sem fidelidade",
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <BuyBtn size="xl" />

            <p className="text-zinc-600 text-xs mt-4 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pagamento seguro · PIX liberado na hora
            </p>
          </div>

          {/* Guarantee */}
          <div className="inline-flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-2xl px-6 py-4 text-sm text-zinc-400 max-w-xs mx-auto">
            <span className="text-2xl">🛡️</span>
            <span>
              Se não funcionar na <strong className="text-white">primeira resposta</strong>, resolve direto com a gente.
            </span>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="bg-[var(--bg-card)] border-y border-white/5 py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-black">Perguntas frequentes</h2>
            </div>

            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
                >
                  <button
                    className="w-full text-left px-5 py-4 font-semibold flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`text-green-400 text-xl leading-none transition-transform duration-200 flex-shrink-0 ${
                        openFaq === i ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-green-500/5 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <p className="text-3xl sm:text-4xl font-black mb-3">
                Ainda em dúvida?
              </p>
              <p className="text-xl text-zinc-400 mb-8">
                Teste por <span className="text-white font-bold">R$ 9,90</span> — 24h sem risco.
              </p>
              <div className="flex flex-col items-center gap-3">
                <BuyBtn size="xl" label="👉 Ativar meu acesso agora" />
                <p className="text-zinc-600 text-sm">Mais de 1.200 pessoas já usam · Ativa em 2 minutos</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-8 px-4 text-center text-zinc-600 text-sm">
          <p className="font-semibold text-zinc-500 mb-1">
            Resposta<span className="text-green-500">Perfeita</span>
          </p>
          <p>© {new Date().getFullYear()} Resposta Perfeita. Todos os direitos reservados.</p>
          <p className="mt-1">Produto digital — sem garantia de resultado específico.</p>
        </footer>
      </main>

      {/* ── MOBILE STICKY CTA ─────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-[#080808]/90 backdrop-blur-md border-t border-white/5">
        <button
          onClick={handleBuy}
          disabled={loading}
          className="btn-pulse w-full bg-green-500 hover:bg-green-400 text-black font-black text-base py-3.5 rounded-2xl transition-all duration-200 disabled:opacity-60"
        >
          {loading ? "Aguardando..." : "👉 Ativar agora — R$ 9,90"}
        </button>
      </div>
    </>
  );
}
