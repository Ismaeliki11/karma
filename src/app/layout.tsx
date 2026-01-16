import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // sleek, modern, geometric
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Karma Centro de Estética",
    template: "%s | Karma Estética",
  },
  description: "Centro de Estética Karma en Totana - Manicura, Pedicura, Tratamientos Faciales y Corporales en un ambiente relajante y exclusivo.",
  keywords: ["estética", "manicura", "pedicura", "facial", "corporal", "belleza", "karma", "totana", "murcia"],
  authors: [{ name: "Karma Centro de Estética" }],
  creator: "Karma Centro de Estética",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://centroesteticakarma.netlify.app",
    title: "Karma Centro de Estética",
    description: "Descubre tu mejor versión en Karma. Tratamientos exclusivos de manicura, pedicura y estética facial y corporal.",
    siteName: "Karma Centro de Estética",
    images: [
      {
        url: "/og-image.jpg", // We might need to create this later or use a placeholder if not exists, but defining it is good practice
        width: 1200,
        height: 630,
        alt: "Karma Centro de Estética",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karma Centro de Estética",
    description: "Centro de Estética Karma - Tu espacio de belleza y bienestar.",
    creator: "@karmaestetica", // Placeholder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${outfit.variable} antialiased bg-background text-foreground tracking-wide`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
