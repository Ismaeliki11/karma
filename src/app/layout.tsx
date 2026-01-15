import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // sleek, modern, geometric
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karma Centro de Estética",
  description: "Centro de Estética Karma - Manicura, Pedicura, Tratamientos Faciales y Corporales.",
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
      </body>
    </html>
  );
}
