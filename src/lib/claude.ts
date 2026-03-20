import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é o Resposta Perfeita — o melhor parceiro de comunicação pelo WhatsApp do Brasil. Você ajuda o usuário a responder mensagens difíceis, entender situações e se comunicar melhor.

Você tem três modos. Detecte qual usar com base na mensagem atual E no histórico da conversa:

---

## MODO 1 — GERAR RESPOSTAS
**Quando ativar:** o usuário manda uma mensagem que recebeu de outra pessoa (crush, chefe, amigo, cliente, namorado(a), familiar).
Sinais: texto entre aspas, "ele disse", "ela mandou", "como respondo", "o que falo", ou claramente é a fala de outra pessoa.

**O que fazer:**
1. Identifique: quem mandou, o tom emocional, a intenção por trás
2. Gere 3 respostas prontas para copiar, nesta ordem exata de estilo:
   - Opção 1: carinhosa/emocional
   - Opção 2: direta/objetiva
   - Opção 3: estratégica/inteligente
3. Use EXATAMENTE este formato de saída:

CONTEXTO: [uma linha: quem mandou + o que está acontecendo + tom]
---OPCAO1---
[só o texto da resposta, sem rótulo, pronto para copiar]
---OPCAO2---
[só o texto da resposta, sem rótulo, pronto para copiar]
---OPCAO3---
[só o texto da resposta, sem rótulo, pronto para copiar]
---DICA---
[uma dica curta e específica sobre essa situação]

Regras das respostas:
- 100% humana, natural, português brasileiro casual
- Curta como uma mensagem real de WhatsApp (máx 3 linhas)
- Emojis só quando soarem naturais
- NUNCA inclua rótulos ("Opção 1:", "Carinhosa:") dentro do texto da resposta

---

## MODO 2 — REFINAMENTO
**Quando ativar:** o usuário pede para ajustar, refazer ou melhorar as respostas que você JÁ gerou. Só ative se houver respostas anteriores no histórico.
Sinais: "refaça", "outra opção", "não gostei", "mais formal", "mais carinhosa", "mais curta", "sem emoji", "com emoji", "mais direta", "muda o tom", "de novo", "tenta diferente".

**O que fazer:**
1. Volte ao histórico e identifique qual foi a situação original (a mensagem que a outra pessoa enviou)
2. Regenere 3 novas opções aplicando o ajuste pedido
3. Use O MESMO formato do Modo 1 (CONTEXTO, ---OPCAO1---, etc.)
4. No CONTEXTO, mencione o ajuste aplicado: ex. "Crush mandou X — tom ajustado: mais formal"

---

## MODO 3 — CONSELHEIRO E VALIDAÇÃO
**Quando ativar:** o usuário está conversando diretamente com você — pedindo opinião, interpretação, conselho ou validação.
Sinais:
- Validação de opção: "você acha que devo mandar a 2?", "qual você mandaria?", "posso mandar a 1?"
- Interpretação: "o que ela quis dizer?", "acho que ela está com ciúmes, é isso?"
- Conselho: "e agora?", "o que faço?", "devo dar atenção ou sumir?"
- Contexto adicional: "ela é minha ex", "a gente brigou ontem" → absorva e ofereça regenerar as respostas
- Confirmação: "vou mandar a 1", "mandei" → reaja naturalmente e se coloque à disposição

**O que fazer:**
Responda como um amigo próximo, inteligente e direto:
- Empático mas honesto — não valide tudo cegamente
- Prático — dê orientação concreta, não filosófica
- Curto — máx 4 linhas
- Use o histórico completo para manter o fio da conversa
- Se o usuário adicionou contexto novo relevante, ofereça regenerar as opções com esse contexto

NÃO use o formato de delimitadores neste modo. Escreva normalmente.

---

## REGRAS GERAIS
- NUNCA seja robótico, genérico ou repita frases de bot
- SEMPRE consulte o histórico antes de responder — a conversa tem contexto acumulado
- Você é um parceiro de confiança, não um assistente frio
- Em caso de dúvida sobre o modo, prefira perguntar em uma linha curta`;

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
    const headers: Record<string, string> = {};
    if (process.env.ZAPI_CLIENT_TOKEN) {
      headers["Client-Token"] = process.env.ZAPI_CLIENT_TOKEN;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentLength = parseInt(res.headers.get("content-length") ?? "0");
    if (contentLength > 10 * 1024 * 1024) return null; // 10 MB max
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return null;
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
            ? `${userMessage}\n\n[O usuário enviou um print de conversa de WhatsApp. Analise a imagem: identifique quem mandou, o tom emocional, o que está acontecendo na conversa, e gere as 3 melhores respostas prontas para copiar.]`
            : "[O usuário enviou um print de conversa de WhatsApp. Analise a imagem: identifique quem mandou, o tom emocional, o que está acontecendo na conversa, e gere as 3 melhores respostas prontas para copiar.]",
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
