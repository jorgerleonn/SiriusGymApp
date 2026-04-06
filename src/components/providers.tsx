"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f0f0fa",
          colorTextOnPrimaryBackground: "#000000",
          colorBackground: "#000000",
          colorInputBackground: "#000000",
          colorInputText: "#f0f0fa",
          colorText: "#f0f0fa",
          colorTextSecondary: "rgba(240, 240, 250, 0.5)",
          borderRadius: "32px",
          fontFamily: "D-DIN, Arial, Verdana, sans-serif",
        },
        elements: {
          formButtonPrimary: "bg-space-ghost border border-space-ghost-border text-space-spectral hover:bg-[rgba(240,240,250,0.2)] font-bold uppercase tracking-wider",
          card: "bg-space-black border border-space-ghost-border",
          headerTitle: "text-space-spectral font-bold uppercase tracking-wider",
          headerSubtitle: "text-space-spectral/50 uppercase tracking-wider",
          socialButtonsBlockButton: "bg-space-black border border-space-ghost-border text-space-spectral hover:bg-space-ghost",
          formFieldInput: "bg-space-black border border-space-ghost-border text-space-spectral uppercase tracking-wider",
          dividerLine: "bg-space-ghost-border",
          dividerText: "text-space-spectral/50 uppercase tracking-wider",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}