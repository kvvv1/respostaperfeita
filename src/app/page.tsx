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

/* ── WhatsApp Demo ──────────────────────────────────────────────────────── */
function WhatsAppDemo() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [step, setStep]   = useState(0);
  const [typing, setTyping] = useState(false);
  const [tick, setTick]   = useState(0);

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => ids.push(setTimeout(fn, ms));

    setPhase(0); setStep(0); setTyping(false);
    t(900,  () => setStep(1));
    t(3200, () => { setPhase(1); setStep(0); setTyping(false); });
    t(3800, () => setStep(1));
    t(5200, () => setTyping(true));
    t(7200, () => { setTyping(false); setStep(2); });
    t(11500,() => { setPhase(2); setStep(1); });
    t(12400,() => setStep(2));
    t(14200,() => setStep(3));

    return () => ids.forEach(clearTimeout);
  }, [tick]);

  useEffect(() => {
    const id = setInterval(() => setTick(k => k + 1), 17000);
    return () => clearInterval(id);
  }, []);

  const Recv = ({ text, time }: { text: string; time: string }) => (
    <div className="flex justify-start animate-[fadeIn_0.25s_ease-out]">
      <div className="relative max-w-[82%] bg-[#202C33] rounded-[10px] rounded-tl-[2px] px-3 py-[6px] shadow-sm">
        <div className="absolute -left-[6px] top-0 w-0 h-0 border-t-[7px] border-t-[#202C33] border-l-[7px] border-l-transparent" />
        <p className="text-[#E9EDEF] text-[13px] leading-snug whitespace-pre-line">{text}</p>
        <p className="text-[#8696A0] text-[10px] text-right mt-[3px]">{time}</p>
      </div>
    </div>
  );

  const Sent = ({ text, time, read }: { text: string; time: string; read: boolean }) => (
    <div className="flex justify-end animate-[fadeIn_0.25s_ease-out]">
      <div className="relative max-w-[82%] bg-[#005C4B] rounded-[10px] rounded-tr-[2px] px-3 py-[6px] shadow-sm">
        <div className="absolute -right-[6px] top-0 w-0 h-0 border-t-[7px] border-t-[#005C4B] border-r-[7px] border-r-transparent" />
        <p className="text-[#E9EDEF] text-[13px] leading-snug whitespace-pre-line">{text}</p>
        <div className="flex items-center justify-end gap-1 mt-[3px]">
          <span className="text-[#8696A0] text-[10px]">{time}</span>
          <svg className={`w-4 h-[9px] ${read ? "text-[#53BDEB]" : "text-[#8696A0]"}`} viewBox="0 0 16 11" fill="currentColor">
            <path d="M11.071.653a.75.75 0 0 1 .976 1.138l-6.5 6a.75.75 0 0 1-1.076-.093l-2.5-3a.75.75 0 1 1 1.158-.964L5.292 6.7l5.779-6.047zm3 0a.75.75 0 0 1 .976 1.138l-6.5 6a.75.75 0 0 1-.961.046L9.5 6.42l.74-.848.617.538 5.214-5.457z"/>
          </svg>
        </div>
      </div>
    </div>
  );

  const Dots = () => (
    <div className="flex justify-start animate-[fadeIn_0.25s_ease-out]">
      <div className="bg-[#202C33] rounded-[10px] rounded-tl-[2px] px-3 py-3">
        <span className="flex gap-[5px] items-center">
          {[0,1,2].map(d => (
            <span key={d} className="w-[7px] h-[7px] bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: `${d * 200}ms` }} />
          ))}
        </span>
      </div>
    </div>
  );

  const isBot = phase === 1;
  const headerName     = isBot ? "Resposta Perfeita" : "Ju 💚";
  const headerAvatar   = isBot ? "RP" : "A";
  const headerSub      = isBot
    ? (typing ? "digitando..." : "online agora")
    : (phase === 2 && step >= 2 ? "online" : "visto por último hoje");
  const headerSubColor = (isBot && typing) || (phase === 2 && step >= 2) ? "text-[#00A884]" : "text-[#8696A0]";
  const avatarBg       = isBot ? "bg-green-600" : "bg-[#D63384]";

  return (
    <div className="w-full max-w-[285px] mx-auto select-none">
      {/* Phone shell */}
      <div
        className="rounded-[2.2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.85)]"
        style={{ border: "6px solid #111", background: "#0B141A", height: 510 }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-5 pt-[6px] pb-[2px] bg-[#0B141A]">
          <span className="text-white text-[11px] font-semibold">9:41</span>
          <div className="flex items-center gap-[5px]">
            {/* Signal */}
            <svg className="w-[14px] h-[10px] text-white" fill="currentColor" viewBox="0 0 18 12">
              <rect x="0"  y="8" width="3" height="4" rx="0.5"/>
              <rect x="5"  y="5.5" width="3" height="6.5" rx="0.5"/>
              <rect x="10" y="3" width="3" height="9" rx="0.5"/>
              <rect x="15" y="0" width="3" height="12" rx="0.5" opacity="0.3"/>
            </svg>
            {/* Wifi */}
            <svg className="w-[14px] h-[10px] text-white" fill="currentColor" viewBox="0 0 24 17">
              <path d="M12 3C7.95 3 4.21 4.34 1.2 6.6L0 5.1A15.85 15.85 0 0 1 12 1a15.85 15.85 0 0 1 12 4.1L22.8 6.6A13 13 0 0 0 12 3z" opacity="0.4"/>
              <path d="M12 7.5c-2.76 0-5.26 1.12-7.09 2.93L3.64 9.16A11.1 11.1 0 0 1 12 6a11.1 11.1 0 0 1 8.36 3.16l-1.27 1.27A9.1 9.1 0 0 0 12 7.5z" opacity="0.7"/>
              <path d="M12 12a5.5 5.5 0 0 0-3.9 1.62L6.82 12.34A7.56 7.56 0 0 1 12 10.5a7.56 7.56 0 0 1 5.18 1.84l-1.28 1.28A5.5 5.5 0 0 0 12 12z"/>
              <circle cx="12" cy="16" r="2"/>
            </svg>
            {/* Battery */}
            <div className="flex items-center gap-[1px]">
              <div className="border border-white/80 rounded-[2px] w-[19px] h-[10px] p-[1.5px]">
                <div className="bg-white rounded-[1px] h-full w-[80%]"/>
              </div>
              <div className="w-[2px] h-[5px] bg-white/60 rounded-full"/>
            </div>
          </div>
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#202C33] flex items-center gap-2 px-2 py-[9px]">
          <svg className="w-[22px] h-[22px] text-[#AEBAC1] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <div className={`w-[34px] h-[34px] rounded-full ${avatarBg} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 transition-colors duration-500`}>
            {headerAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#E9EDEF] text-[13px] font-medium leading-none truncate">{headerName}</p>
            <p className={`text-[11px] mt-[3px] transition-colors duration-300 ${headerSubColor}`}>{headerSub}</p>
          </div>
          <div className="flex items-center gap-[14px] text-[#AEBAC1] pr-1">
            <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
            </svg>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="px-2 py-2 space-y-[6px] overflow-hidden"
          style={{
            height: 360,
            backgroundColor: "#0B141A",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 48 48 0M-6 6 6-6M42 54 54 42' stroke='%23ffffff' stroke-width='0.4' stroke-opacity='0.025'/%3E%3C/svg%3E")`,
          }}
        >
          <div className="flex justify-center mb-1">
            <span className="bg-[#182229]/90 text-[#8696A0] text-[10px] px-3 py-[3px] rounded-full">Hoje</span>
          </div>

          {phase === 0 && (
            <>
              {step >= 1 && <Recv text="tá bom né. fica assim então." time="21:14" />}
            </>
          )}

          {phase === 1 && (
            <>
              {step >= 1 && <Sent text="tá bom né. fica assim então." time="21:15" read={false} />}
              {typing && <Dots />}
              {step >= 2 && (
                <Recv
                  text={"✅ Opção 1:\nei, não quero ficar assim com você. me fala o que tá te incomodando? 🥺\n\n✅ Opção 2:\nnão quero isso não... posso te ligar? quero resolver isso 💚"}
                  time="21:15"
                />
              )}
            </>
          )}

          {phase === 2 && (
            <>
              {step >= 1 && <Recv text="tá bom né. fica assim então." time="21:14" />}
              {step >= 2 && <Sent text="ei, não quero ficar assim com você. me fala o que tá te incomodando? 🥺" time="21:16" read={true} />}
              {step >= 3 && <Recv text="tá... desculpa, tô chateada mesmo. a gente conversa? 💚" time="21:16" />}
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-[#0B141A] flex items-center gap-[6px] px-2 py-[7px]">
          <div className="flex-1 bg-[#2A3942] rounded-full flex items-center gap-2 px-3 py-[7px]">
            <svg className="w-[18px] h-[18px] text-[#8696A0] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
            </svg>
            <span className="text-[#8696A0] text-[13px]">Mensagem</span>
          </div>
          <div className="w-[38px] h-[38px] bg-[#00A884] rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-white ml-[2px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Scene labels */}
      <div className="flex justify-center gap-4 mt-3">
        {(["travou 😬", "usou o bot ✨", "ela abriu 💚"] as const).map((label, i) => (
          <div key={i} className={`flex items-center gap-1 text-[11px] transition-all duration-500 ${phase === i ? "text-green-400" : "text-zinc-700"}`}>
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${phase === i ? "bg-green-400" : "bg-zinc-700"}`} />
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
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
  const [loading, setLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [recovery, setRecovery] = useState<{ pendingId: string } | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("pendingId");
    if (!savedId) return;
    fetch(`/api/phone?pendingId=${savedId}`)
      .then(r => r.json())
      .then(data => {
        if (data.paid && !data.phone) {
          setRecovery({ pendingId: savedId });
        } else if (data.phone) {
          localStorage.removeItem("pendingId");
        }
      })
      .catch(() => {});
  }, []);

  async function handleBuy(plan: string = "TRIAL_24H", price: number = 9.90) {
    setLoading(plan);
    trackInitiateCheckout(price);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.initPoint) {
        localStorage.setItem("pendingId", data.pendingId);
        sessionStorage.setItem("pendingId", data.pendingId);
        window.location.href = data.initPoint;
      }
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  const BuyBtn = ({ size = "lg", label, plan = "TRIAL_24H", price = 9.90 }: { size?: "lg" | "xl"; label?: string; plan?: string; price?: number }) => (
    <button
      onClick={() => handleBuy(plan, price)}
      disabled={!!loading}
      className={`btn-pulse relative overflow-hidden bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-black rounded-2xl transition-all duration-200 disabled:opacity-60 w-full ${
        size === "xl"
          ? "text-xl px-10 py-5 max-w-sm"
          : "text-lg px-8 py-4 max-w-sm"
      }`}
    >
      <span className="relative z-10">
        {loading === plan ? "Aguardando..." : (label ?? "👉 Ativar acesso — R$ 9,90")}
      </span>
    </button>
  );

  return (
    <>
      <LiveNotification />

      {/* ── RECOVERY BANNER ───────────────────────────────────────────── */}
      {recovery && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-black px-4 py-3 text-center text-sm font-bold shadow-lg">
          ✅ Seu pagamento foi aprovado! &nbsp;
          <a
            href={`/obrigado?pendingId=${recovery.pendingId}`}
            className="underline font-black"
          >
            Clique aqui para ativar seu acesso →
          </a>
        </div>
      )}

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#080808]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-white text-lg">
            Resposta<span className="text-green-400">Perfeita</span>
          </span>
          <button
            onClick={() => handleBuy()}
            disabled={!!loading}
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

            {/* WhatsApp Demo */}
            <div className="mb-10 float fade-up-delay2">
              <WhatsAppDemo />
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
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pagamento via <span className="text-white font-semibold">Mercado Pago</span>
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ativa em <span className="text-white font-semibold">menos de 2 minutos</span>
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-semibold">Sem app</span> — funciona no WhatsApp normal
            </span>
            <span className="hidden sm:block w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              PIX ou <span className="text-white font-semibold">cartão</span>
            </span>
          </div>
        </div>

        {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-black">Como funciona?</h2>
          </div>

          <div className="relative">
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
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Preço</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-2">
            Comece agora sem risco
          </h2>
          <p className="text-zinc-400 mb-4">Escolha o plano ideal. Cancele quando quiser.</p>

          {/* Mês do Consumidor badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 text-yellow-400 text-sm font-semibold mb-10">
            🎉 Mês do Consumidor — descontos especiais ativos
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-10">

            {/* 24h */}
            <div className="glow-card bg-[var(--bg-card)] rounded-3xl p-6 flex flex-col">
              <p className="text-zinc-400 text-sm mb-1">Acesso Trial</p>
              <p className="text-zinc-600 text-sm line-through mb-0.5">R$ 19,90</p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-xl font-bold text-zinc-500">R$</span>
                <span className="text-5xl font-black text-white leading-none">9</span>
                <span className="text-2xl font-black text-white leading-none mb-1">,90</span>
              </div>
              <p className="text-zinc-500 text-xs mb-5">por 24 horas completas</p>
              <ul className="space-y-2 text-left mb-6 flex-1">
                {["Respostas em segundos", "Paquera, trabalho e conflito", "2-3 opções por mensagem", "Ativação em 2 minutos"].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <BuyBtn size="lg" label="Ativar por R$ 9,90" plan="TRIAL_24H" price={9.90} />
            </div>

            {/* 7 dias */}
            <div className="glow-card bg-[var(--bg-card)] rounded-3xl p-6 flex flex-col">
              <p className="text-zinc-400 text-sm mb-1">Acesso 7 dias</p>
              <p className="text-zinc-600 text-sm line-through mb-0.5">R$ 34,90</p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-xl font-bold text-zinc-500">R$</span>
                <span className="text-5xl font-black text-white leading-none">19</span>
                <span className="text-2xl font-black text-white leading-none mb-1">,90</span>
              </div>
              <p className="text-zinc-500 text-xs mb-5">R$ 2,84 por dia</p>
              <ul className="space-y-2 text-left mb-6 flex-1">
                {["Tudo do trial", "7 dias de acesso completo", "Histórico de conversas", "Ideal pra testar no dia a dia"].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <BuyBtn size="lg" label="Ativar por R$ 19,90" plan="WEEK_7D" price={19.90} />
            </div>

            {/* 30 dias — destaque */}
            <div className="glow-card bg-[var(--bg-card)] rounded-3xl p-6 flex flex-col relative border border-green-500/40 ring-1 ring-green-500/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                ✅ Melhor custo-benefício
              </div>
              <p className="text-zinc-400 text-sm mb-1 mt-2">Acesso 30 dias</p>
              <p className="text-zinc-600 text-sm line-through mb-0.5">R$ 69,90</p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-xl font-bold text-zinc-500">R$</span>
                <span className="text-5xl font-black text-white leading-none">39</span>
                <span className="text-2xl font-black text-white leading-none mb-1">,90</span>
              </div>
              <p className="text-green-400 text-xs font-semibold mb-5">apenas R$ 1,33 por dia</p>
              <ul className="space-y-2 text-left mb-6 flex-1">
                {["Tudo do trial e 7 dias", "30 dias de acesso total", "Histórico completo", "Menor custo por dia", "Sem renovação no mês"].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <BuyBtn size="lg" label="Ativar por R$ 39,90" plan="MONTH_30D" price={39.90} />
            </div>

          </div>

          <p className="text-zinc-600 text-xs mb-8 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagamento seguro via Mercado Pago · PIX ou cartão · Ativa em 2 minutos
          </p>

          {/* Guarantee */}
          <div className="inline-flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-2xl px-6 py-4 text-sm text-zinc-400 max-w-xs mx-auto">
            <span className="text-2xl">🛡️</span>
            <span>
              Se a IA não te ajudar na <strong className="text-white">primeira mensagem</strong>, devolvemos seu dinheiro. Sem burocracia.
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
                Ela já respondeu.<br />Você vai saber o que falar?
              </p>
              <p className="text-xl text-zinc-400 mb-8">
                Teste agora por <span className="text-white font-bold">R$ 9,90</span> — 24h sem risco.
              </p>
              <div className="flex flex-col items-center gap-3">
                <BuyBtn size="xl" label="👉 Ativar meu acesso agora" />
                <p className="text-zinc-600 text-sm">Ativa em 2 minutos · Sem app · Direto no WhatsApp</p>
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
          <p className="mt-2">
            <a href="/politica-de-privacidade" className="hover:text-zinc-400 underline">
              Política de Privacidade
            </a>
          </p>
        </footer>
      </main>

      {/* ── MOBILE STICKY CTA ─────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-[#080808]/90 backdrop-blur-md border-t border-white/5">
        <button
          onClick={() => handleBuy()}
          disabled={!!loading}
          className="btn-pulse w-full bg-green-500 hover:bg-green-400 text-black font-black text-base py-3.5 rounded-2xl transition-all duration-200 disabled:opacity-60"
        >
          {loading ? "Aguardando..." : "👉 Ativar agora — R$ 9,90"}
        </button>
      </div>
    </>
  );
}
