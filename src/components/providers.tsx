"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#ffffff",
          colorTextOnPrimaryBackground: "#000000",
          colorBackground: "#000000",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#7e7e7e",
          borderRadius: "0px",
          fontFamily: "D-DIN, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        },
        elements: {
          formButtonPrimary: "bg-primary text-canvas border border-primary rounded-none font-bold uppercase tracking-[1.5px]",
          card: "bg-canvas border border-hairline rounded-none",
          headerTitle: "text-on-dark font-bold uppercase tracking-[0]",
          headerSubtitle: "text-body uppercase tracking-[0]",
          socialButtonsBlockButton: "bg-surface-card border border-hairline text-on-dark hover:bg-surface-elevated",
          formFieldInput: "bg-surface-card border border-hairline text-on-dark uppercase tracking-[1.5px]",
          dividerLine: "bg-hairline",
          dividerText: "text-muted uppercase tracking-[1.5px]",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
