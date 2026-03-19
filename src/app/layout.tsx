import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resposta Perfeita — Nunca mais trave no WhatsApp",
  description:
    "Receba respostas prontas, naturais e que funcionam para qualquer situação no WhatsApp. Powered by IA.",
  openGraph: {
    title: "Resposta Perfeita — Nunca mais trave no WhatsApp",
    description: "Respostas prontas para qualquer situação. Funciona em paquera, trabalho ou conflitos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
