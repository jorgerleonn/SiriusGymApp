"use client";

import Link from "next/link";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { Dumbbell, Star } from "lucide-react";

function AuthButtons() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <>
        <UserButton appearance={{ elements: { avatarBox: "border-2 border-sirius-accent" } }} />
        <Link href="/dashboard" className="px-4 sm:px-6 py-2 bg-sirius-accent/10 border border-sirius-accent/30 
          text-sirius-accent rounded-lg hover:bg-sirius-accent/20 transition-all duration-300 text-sm sm:text-base">
          Mi Dashboard
        </Link>
      </>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="px-4 sm:px-6 py-2 bg-sirius-accent/10 border border-sirius-accent/30 
        text-sirius-accent rounded-lg hover:bg-sirius-accent/20 transition-all duration-300
        hover:shadow-glow text-sm sm:text-base">
        Iniciar Sesión
      </button>
    </SignInButton>
  );
}

function HeroCTA() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="px-6 sm:px-8 py-3 sm:py-4 bg-sirius-accent text-sirius-bg font-bold rounded-xl 
          hover:bg-sirius-star transition-all duration-300 shadow-glow hover:shadow-[0_0_30px_#00d4ff60] text-sm sm:text-base">
        Ir al Dashboard
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="px-6 sm:px-8 py-3 sm:py-4 bg-sirius-accent text-sirius-bg font-bold rounded-xl 
          hover:bg-sirius-star transition-all duration-300 shadow-glow hover:shadow-[0_0_30px_#00d4ff60] text-sm sm:text-base">
        Comenzar Ahora
      </button>
    </SignInButton>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sirius-bg relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-16 sm:top-20 left-16 sm:left-20 w-2 h-2 bg-sirius-accent rounded-full animate-pulse" />
        <div className="absolute top-32 sm:top-40 right-24 sm:right-32 w-1 h-1 bg-white rounded-full" />
        <div className="absolute bottom-32 sm:bottom-40 left-1/4 w-1.5 h-1.5 bg-sirius-accent rounded-full animate-pulse" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2">
          <Star className="w-6 sm:w-8 h-6 sm:h-8 text-sirius-accent drop-shadow-[0_0_8px_#00d4ff]" />
          <span className="text-xl sm:text-2xl font-bold text-sirius-text tracking-wide">
            SIRIUS
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <AuthButtons />
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-sirius-accent to-white 
            bg-clip-text text-transparent tracking-tight">
            Tu progreso brilla
            <br />
            en la oscuridad
          </h1>
          
          <p className="text-base sm:text-xl text-sirius-textMuted max-w-xl mx-auto">
            Registra cada entrenamiento, supervisa tu evolución y alcanza tus metas 
            con Sirius. La estrella más brillante del gym.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
            <HeroCTA />
            
            <Link href="/dashboard" className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-sirius-border 
              text-sirius-text rounded-xl hover:border-sirius-accent/50 transition-all duration-300 text-sm sm:text-base">
              Ver Demo
            </Link>
          </div>

          {/* Feature cards - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
            {[
              { icon: Dumbbell, title: "Registrar", desc: "Crea sesiones y añade ejercicios" },
              { icon: Star, title: "Progresar", desc: "Trackea peso y repeticiones" },
              { icon: Star, title: "Analizar", desc: "Historial completo de workouts" },
            ].map((item, i) => (
              <div key={i} className="p-4 sm:p-6 bg-sirius-surface/50 border border-sirius-border/50 
                rounded-2xl hover:border-sirius-accent/30 transition-all duration-300">
                <item.icon className="w-6 sm:w-8 h-6 sm:h-8 text-sirius-accent mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sirius-text text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-sirius-textMuted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}