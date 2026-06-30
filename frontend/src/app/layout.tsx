import type { Metadata } from "next";
import { ModeNav } from "@/components/shared/ModeNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conseal Hackathon",
  description: "PII anonymization review system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-100 text-stone-950">
        <ModeNav />
        {children}
      </body>
    </html>
  );
}
