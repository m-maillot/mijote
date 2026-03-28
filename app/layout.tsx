import type { Metadata } from "next";
import { Caveat, Inter } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mijoté",
  description: "Les recettes de la famille",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${caveat.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
