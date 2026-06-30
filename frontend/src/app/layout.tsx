import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ModeNav } from "@/components/shared/ModeNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conseal — AI Document Privacy Review",
  description: "Detect, review, correct, and export redacted documents with transparent audit trails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-stone-50 text-stone-950 antialiased`}>
        <ModeNav />
        {children}
      </body>
    </html>
  );
}
