import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Structured Output LLM Stress Tester",
  description: "Test and compare how different LLMs handle structured output with Zod schema validation. Optimize your prompts for JSON schema compliance across OpenAI, Anthropic, and other models.",
  keywords: [
    "LLM testing",
    "structured output",
    "JSON schema",
    "Zod validation",
    "prompt engineering",
    "OpenRouter",
    "AI testing",
    "model comparison"
  ],
  authors: [{ name: "AI Testing Tools" }],
  creator: "AI Testing Tools",
  publisher: "AI Testing Tools",
  metadataBase: new URL("https://teststructuredoutput.vercel.app"),
  alternates: {
    canonical: "https://teststructuredoutput.vercel.app",
  },
  openGraph: {
    title: "Structured Output LLM Stress Tester",
    description: "Compare how different AI models handle structured JSON output with Zod schemas. Optimize your prompts for schema compliance.",
    url: "https://teststructuredoutput.vercel.app",
    siteName: "Structured Output LLM Stress Tester",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Structured Output LLM Stress Tester",
    description: "Compare how different AI models handle structured JSON output with Zod schemas",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/zod@3.23.8/lib/index.umd.js"></script>
        <script>window.z = window.Zod;</script>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-TW5N099G0G"
        ></script>
        <Script id="gtag-init" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TW5N099G0G');
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
