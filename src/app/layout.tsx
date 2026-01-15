import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // sleek, modern, geometric
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karma Centro de Estética",
  description: "Centro de Estética Karma - Manicura, Pedicura, Tratamientos Faciales y Corporales.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.webp", // Modern browsers
    apple: "/favicon.webp", // iOS
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
