import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sirius - Gym Tracker",
  description: "Track your gym progress with Sirius",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-sirius-bg text-sirius-text min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}