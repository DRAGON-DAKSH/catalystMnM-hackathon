import type { Metadata } from "next";
import { Lexend, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-deva",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareCircle",
  description: "Medication and appointment care for elders, together with their family.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${deva.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}