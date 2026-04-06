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
        <UserButton appearance={{ elements: { avatarBox: "border-2 border-space-ghost-border" } }} />
        <Link href="/dashboard" className="px-[18px] py-[18px] bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.81rem] font-bold">
          Mi Dashboard
        </Link>
      </>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="px-[18px] py-[18px] bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.81rem] font-bold">
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
      <Link href="/dashboard" className="inline-block px-[18px] py-[18px] bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.81rem] font-bold">
        Ir al Dashboard
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="inline-block px-[18px] py-[18px] bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.81rem] font-bold">
        Comenzar Ahora
      </button>
    </SignInButton>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-space-black relative">
      {/* Full viewport sections - cinematic experience */}
      
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background gradient overlay on black */}
        <div className="absolute inset-0 bg-gradient-to-b from-space-overlay via-transparent to-space-overlay z-10" />
        
        {/* Abstract space background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,30,60,0.8)_0%,_#000000_70%)]" />
        
        {/* Star field effect */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-space-spectral rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-[20%] right-[30%] w-0.5 h-0.5 bg-space-spectral/50 rounded-full" />
          <div className="absolute top-[40%] left-[10%] w-0.5 h-0.5 bg-space-spectral/30 rounded-full" />
          <div className="absolute top-[60%] right-[20%] w-1 h-1 bg-space-spectral/40 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute top-[80%] left-[40%] w-0.5 h-0.5 bg-space-spectral/60 rounded-full" />
          <div className="absolute top-[30%] left-[60%] w-0.5 h-0.5 bg-space-spectral/20 rounded-full" />
        </div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-2">
            <Star className="w-8 h-8 text-space-spectral" />
            <span className="text-[1.5rem] font-bold tracking-[0.96px]">SIRIUS</span>
          </div>
          <div className="flex items-center gap-4">
            <AuthButtons />
          </div>
        </nav>

        {/* Hero Content */}
        <main className="relative z-20 flex flex-col items-center justify-center h-[calc(100vh-100px)] px-4 text-center">
          <div className="max-w-4xl space-y-8">
            <h1 className="text-[3rem] md:text-[4rem] lg:text-[5rem] font-bold text-space-spectral tracking-[0.96px] leading-[1.00]">
              Tu progreso brilla
              <br />
              en la oscuridad
            </h1>
            
            <p className="text-[1rem] text-space-spectral/70 max-w-xl mx-auto" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
              Registra cada entrenamiento, supervisa tu evolución y alcanza tus metas con Sirius. La estrella más brillante del gym.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <HeroCTA />
              
              <Link href="/dashboard" className="px-[18px] py-[18px] bg-transparent border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-space-ghost transition-all duration-300 text-[0.81rem]">
                Ver Demo
              </Link>
            </div>
          </div>
        </main>
      </section>

      {/* Features Section - Full viewport */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,30,60,0.6)_0%,_#000000_60%)]" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Dumbbell, title: "Registrar", desc: "Crea sesiones y añade ejercicios" },
              { icon: Star, title: "Progresar", desc: "Trackea peso y repeticiones" },
              { icon: Star, title: "Analizar", desc: "Historial completo de workouts" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-12 h-12 text-space-spectral mx-auto mb-4" />
                <h3 className="text-[1.25rem] font-bold text-space-spectral mb-2">{item.title}</h3>
                <p className="text-space-spectral/60" style={{ letterSpacing: 'normal', textTransform: 'none' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}