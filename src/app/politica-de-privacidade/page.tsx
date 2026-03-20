import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Resposta Perfeita",
  description: "Política de Privacidade do Resposta Perfeita.",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-black text-white">Política de Privacidade</h1>
        <p className="text-zinc-500 text-sm">Última atualização: março de 2025</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Dados Coletados</h2>
          <p>
            Ao utilizar o <strong className="text-white">Resposta Perfeita</strong>, coletamos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Número de telefone (WhatsApp) fornecido por você no cadastro</li>
            <li>Conteúdo das mensagens que você envia para o assistente</li>
            <li>Dados de pagamento processados pelo Mercado Pago (não armazenamos dados de cartão)</li>
            <li>Dados de navegação coletados pelo Meta Pixel (cookies de terceiros)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Como Usamos Seus Dados</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Prestar o serviço de geração de respostas via WhatsApp</li>
            <li>Enviar mensagens do assistente para o seu número</li>
            <li>Gerenciar sua assinatura e acesso ao serviço</li>
            <li>Melhorar a qualidade das respostas geradas</li>
            <li>Medir o desempenho de campanhas de marketing (via Meta Pixel e Conversions API)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Compartilhamento com Terceiros</h2>
          <p>Seus dados podem ser processados pelos seguintes parceiros:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>
              <strong className="text-zinc-300">Anthropic (Claude AI)</strong> — processa o conteúdo das mensagens para gerar respostas inteligentes
            </li>
            <li>
              <strong className="text-zinc-300">Z-API</strong> — plataforma utilizada para envio e recebimento de mensagens via WhatsApp
            </li>
            <li>
              <strong className="text-zinc-300">Mercado Pago</strong> — processamento de pagamentos
            </li>
            <li>
              <strong className="text-zinc-300">Meta (Facebook)</strong> — rastreamento de conversões via Pixel e Conversions API para fins de publicidade
            </li>
            <li>
              <strong className="text-zinc-300">Vercel / Supabase</strong> — infraestrutura de hospedagem e banco de dados
            </li>
          </ul>
          <p className="text-zinc-400">
            Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais além dos listados acima.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Cookies e Rastreamento</h2>
          <p className="text-zinc-400">
            Utilizamos o Meta Pixel para medir o desempenho de nossos anúncios no Facebook e Instagram. Isso pode incluir o armazenamento de cookies no seu navegador. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">5. Retenção de Dados</h2>
          <p className="text-zinc-400">
            Mantemos seus dados enquanto sua conta estiver ativa ou enquanto necessário para prestação do serviço. Mensagens são armazenadas para fornecer contexto de conversa ao assistente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">6. Seus Direitos (LGPD)</h2>
          <p className="text-zinc-400">
            De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Acessar os dados que temos sobre você</li>
            <li>Corrigir dados incorretos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento para tratamento dos dados</li>
          </ul>
          <p className="text-zinc-400">
            Para exercer qualquer destes direitos, entre em contato pelo e-mail:{" "}
            <a
              href="mailto:contato@respostaperfeita.com"
              className="text-green-400 underline hover:text-green-300"
            >
              contato@respostaperfeita.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">7. Segurança</h2>
          <p className="text-zinc-400">
            Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. O acesso ao banco de dados é restrito e autenticado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">8. Contato</h2>
          <p className="text-zinc-400">
            Dúvidas sobre esta política? Fale conosco:{" "}
            <a
              href="mailto:contato@respostaperfeita.com"
              className="text-green-400 underline hover:text-green-300"
            >
              contato@respostaperfeita.com
            </a>
          </p>
        </section>

        <div className="pt-8 border-t border-zinc-800">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
            ← Voltar para o início
          </a>
        </div>
      </div>
    </div>
  );
}
