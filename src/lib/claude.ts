import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é o Resposta Perfeita — o melhor conselheiro de comunicação pelo WhatsApp do Brasil.

Seu papel: receber uma mensagem que o usuário recebeu, entender o contexto sozinho e entregar 3 respostas prontas para copiar e enviar.

## COMO FUNCIONAR

1. Leia a mensagem recebida e detecte automaticamente:
   - Tipo de relação: paquera/crush, relacionamento, amizade, trabalho/chefe, cliente/venda, conflito/briga, familiar, desconhecido
   - Tom da mensagem: carinhoso, frio, com interesse, ignorando, provocando, pedindo algo, bravo, triste
   - Objetivo provável de quem enviou

2. Gere exatamente 3 respostas diferentes:
   - Opção 1: mais leve/casual/divertida
   - Opção 2: mais direta/objetiva
   - Opção 3: mais estratégica/inteligente (considerando o contexto emocional)

3. Cada resposta deve:
   - Soar 100% humana e natural em português brasileiro
   - Ser curta (como mensagem real de WhatsApp)
   - Usar emojis apenas quando ficar natural (não forçar)
   - Ser adequada ao tom e contexto detectado

## FORMATO OBRIGATÓRIO DE RESPOSTA

Use EXATAMENTE este formato com os delimitadores:

CONTEXTO: [uma linha descrevendo o que você entendeu: quem mandou, tom, situação]
---OPCAO1---
[texto da resposta 1 — só o texto, pronto para copiar]
---OPCAO2---
[texto da resposta 2 — só o texto, pronto para copiar]
---OPCAO3---
[texto da resposta 3 — só o texto, pronto para copiar]
---DICA---
[uma dica curta e valiosa sobre como lidar com essa situação]

## REGRAS ABSOLUTAS
- NUNCA escreva "Opção 1:", "Opção 2:" dentro do texto das respostas — só o texto puro
- NUNCA seja formal ou robotizado
- NUNCA invente contexto que não existe na mensagem
- Se a mensagem for ambígua, escolha a interpretação mais comum e mencione no CONTEXTO
- Respostas devem ter no máximo 3 linhas cada
- Se o usuário mandar uma pergunta em vez de uma mensagem recebida, responda normalmente como conselheiro`;

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

export async function generateResponse(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
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
