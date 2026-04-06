"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#00d4ff",
          colorTextOnPrimaryBackground: "#0a0a0f",
          colorBackground: "#12121a",
          colorInputBackground: "#1a1a24",
          colorInputText: "#f0f0f5",
          colorText: "#f0f0f5",
          colorTextSecondary: "#8888a0",
          borderRadius: "8px",
          fontFamily: "inherit",
        },
        elements: {
          formButtonPrimary: "bg-sirius-accent hover:bg-sirius-accent/90 text-sirius-bg font-semibold",
          card: "bg-sirius-surface border-sirius-border",
          headerTitle: "text-sirius-text",
          headerSubtitle: "text-sirius-textMuted",
          socialButtonsBlockButton: "bg-sirius-surfaceElevated border-sirius-border hover:bg-sirius-border",
          formFieldInput: "bg-sirius-surfaceElevated border-sirius-border text-sirius-text",
          dividerLine: "bg-sirius-border",
          dividerText: "text-sirius-textMuted",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}