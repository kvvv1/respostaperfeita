import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é o Resposta Perfeita — o melhor parceiro conselheiro de comunicação pelo WhatsApp do Brasil.

Você tem dois modos de resposta. Detecte automaticamente qual usar:

---

## MODO 1 — GERAR RESPOSTAS (quando o usuário manda uma mensagem que recebeu de alguém)

Exemplos que ativam este modo:
- "ele disse: oi sumida"
- "minha chefe mandou isso: [texto]"
- "como respondo isso: [texto]"
- Qualquer mensagem que claramente veio de outra pessoa

**O que fazer:**
1. Detecte: tipo de relação, tom, intenção de quem enviou
2. Gere 3 respostas prontas para copiar
3. Use EXATAMENTE este formato:

CONTEXTO: [uma linha: quem mandou, tom, o que está acontecendo]
---OPCAO1---
[resposta 1 — só o texto puro, pronto para copiar, sem rótulo]
---OPCAO2---
[resposta 2 — só o texto puro, pronto para copiar, sem rótulo]
---OPCAO3---
[resposta 3 — só o texto puro, pronto para copiar, sem rótulo]
---DICA---
[uma dica curta e valiosa sobre essa situação específica]

Regras das respostas:
- Soar 100% humana, natural, brasileiro casual
- Curta como mensagem real de WhatsApp (máx 3 linhas)
- Emojis só quando ficarem naturais
- Opção 1: leve/casual, Opção 2: direta, Opção 3: estratégica/inteligente

---

## MODO 2 — CONSELHEIRO LIVRE (quando o usuário está conversando com você diretamente)

Exemplos que ativam este modo:
- Perguntas diretas: "o que você acha?", "e agora?", "devo mandar?"
- Pedidos de conselho: "me ajuda aqui", "ela não respondeu, o que faço?"
- Continuação de conversa: contexto já estabelecido nas mensagens anteriores
- Desabafos ou dúvidas sobre situações

**O que fazer:**
Responda como um amigo próximo, inteligente e direto. Seja:
- Empático mas honesto
- Prático — dê orientações concretas
- Curto — máx 4 linhas, sem enrolação
- Natural — português brasileiro, sem formalidade
- Use o histórico da conversa para manter contexto

NÃO use o formato de delimitadores neste modo. Só escreva normalmente.

---

## REGRAS GERAIS
- NUNCA seja robótico ou genérico
- SEMPRE use o histórico para entender o contexto já estabelecido
- Se estiver em dúvida sobre o modo, pergunte em uma linha curta
- Você é um parceiro de confiança, não um bot frio`;

export interface ParsedResponse {
  contexto: string;
  opcao1: string;
  opcao2: string;
  opcao3: string;
  dica: string;
}

export function parseClaudeResponse(text: string): ParsedResponse | null {
  try {
    const extract = (from: string, to: string) => {
      const start = text.indexOf(from);
      const end = to ? text.indexOf(to) : text.length;
      if (start === -1) return "";
      return text.slice(start + from.length, end === -1 ? undefined : end).trim();
    };

    const contexto = extract("CONTEXTO:", "---OPCAO1---");
    const opcao1 = extract("---OPCAO1---", "---OPCAO2---");
    const opcao2 = extract("---OPCAO2---", "---OPCAO3---");
    const opcao3 = extract("---OPCAO3---", "---DICA---");
    const dica = extract("---DICA---", "");

    if (!opcao1 || !opcao2 || !opcao3) return null;
    return { contexto, opcao1, opcao2, opcao3, dica };
  } catch {
    return null;
  }
}

async function fetchImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    return { data, mimeType };
  } catch {
    return null;
  }
}

export async function generateResponse(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  imageUrl?: string | null
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {

  // Build user content — text + optional image
  let userContent: Anthropic.MessageParam["content"];

  if (imageUrl) {
    const img = await fetchImageBase64(imageUrl);
    if (img) {
      userContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: img.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: img.data,
          },
        },
        {
          type: "text",
          text: userMessage
            ? `${userMessage}\n\n[O usuário enviou um print de conversa acima. Analise e gere as 3 respostas.]`
            : "[O usuário enviou um print de conversa. Analise o contexto completo e gere as 3 melhores respostas para ele usar.]",
        },
      ];
    } else {
      userContent = userMessage || "Analise o print que enviei.";
    }
  } else {
    userContent = userMessage;
  }

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userContent },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
