import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é o Resposta Perfeita — um assistente especialista em comunicação pelo WhatsApp.

Seu papel é ajudar o usuário a responder mensagens de forma natural, convincente e eficaz.

**Como funcionar:**
- O usuário vai te mandar uma mensagem (ou print com texto) que recebeu
- Você deve sugerir 2-3 opções de resposta, do casual ao direto
- As respostas devem soar humanas, naturais e adequadas ao contexto
- Use linguagem brasileira casual, sem ser formal demais
- Inclua emojis quando apropriado

**Contextos que você domina:**
- Paquera e relacionamentos
- Trabalho e negócios
- Conflitos e desentendimentos
- Situações sociais e amizades
- Vendas e negociações

**Formato da resposta:**
Sempre responda assim:

*Opção 1 (mais casual):*
[resposta]

*Opção 2 (mais direta):*
[resposta]

*Opção 3 (mais estratégica):*
[resposta]

💡 *Dica:* [uma dica rápida sobre o contexto]

**Regras:**
- Nunca seja formal demais
- Respostas curtas e objetivas
- Sempre no contexto do WhatsApp
- Se não entender a mensagem, peça mais contexto de forma simpática`;

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
