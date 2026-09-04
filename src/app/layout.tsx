import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/axiom/shared/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Axiom — Ask anything. Build anything.",
  description:
    "Axiom is an AI platform with two flagship products: Axiom Chat, a ChatGPT-class AI assistant, and Axiom Studio, a Windsurf-class AI-native IDE.",
  keywords: [
    "Axiom",
    "AI",
    "AI Chat",
    "AI IDE",
    "Code Editor",
    "Developer Tools",
    "AI Assistant",
  ],
  authors: [{ name: "Axiom" }],
  openGraph: {
    title: "Axiom — Ask anything. Build anything.",
    description:
      "Axiom Chat + Axiom Studio. One brand, one account, infinite possibilities.",
    siteName: "Axiom",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom — Ask anything. Build anything.",
    description: "Axiom Chat + Axiom Studio.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative z-10">
            {children}
          </div>
          <Toaster />
          <SonnerToaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
