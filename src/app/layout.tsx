import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Resposta Perfeita — Nunca mais trave em uma conversa",
  description:
    "IA que sugere respostas prontas pra qualquer conversa. Paquera, trabalho ou conflito. Ative em 2 minutos por R$ 9,90.",
  keywords: "whatsapp, resposta, ia, inteligência artificial, paquera, relacionamento",
  openGraph: {
    title: "Resposta Perfeita — Nunca mais trave em uma conversa",
    description: "IA que sugere respostas prontas pra qualquer conversa. Ative agora por R$ 9,90.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col antialiased bg-[#080808] text-white">
        {children}
      </body>
    </html>
  );
}
