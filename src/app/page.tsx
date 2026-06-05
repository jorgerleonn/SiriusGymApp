"use client";

import Link from "next/link";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { Dumbbell, Star, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MStripe } from "@/components/ui/m-stripe";

function AuthButtons() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "border-2 border-hairline w-10 h-10",
            },
          }}
        />
        <Link href="/dashboard">
          <Button variant="primary" size="sm">
            MI DASHBOARD
          </Button>
        </Link>
      </>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button variant="primary" size="sm">
        INICIAR SESIÓN
      </Button>
    </SignInButton>
  );
}

function HeroCTA() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <Link href="/dashboard">
        <Button variant="primary" size="md">
          IR AL DASHBOARD
        </Button>
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button variant="primary" size="md">
        COMENZAR AHORA
      </Button>
    </SignInButton>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Nav */}
      <nav className="flex items-center justify-between px-xl py-lg border-b border-hairline">
        <div className="flex items-center gap-md">
          <Star className="w-6 h-6 text-primary" />
          <span className="text-title-lg font-display text-primary tracking-[0]">
            SIRIUS
          </span>
          <MStripe className="w-8" />
        </div>
        <div className="flex items-center gap-md">
          <AuthButtons />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-[80vh] flex items-center border-b border-hairline">
        <div className="max-w-7xl mx-auto px-xl py-xxl w-full">
          <div className="max-w-3xl">
            <MStripe className="mb-xl w-24" />
            <h1 className="text-display-xl font-display text-primary tracking-[0] leading-[1]">
              TU PROGRESO
              <br />
              BRILLA EN LA
              <br />
              OSCURIDAD
            </h1>
            <p className="text-body-md text-body max-w-xl mt-xl mb-xxl tracking-[0]">
              Registra cada entrenamiento, supervisa tu evolución y alcanza tus metas
              con Sirius. La estrella más brillante del gym.
            </p>
            <HeroCTA />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-xl py-section">
        <MStripe className="mb-xl w-16" />
        <h2 className="text-display-lg font-display text-primary tracking-[0] mb-xxl">
            CARACTERÍSTICAS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline">
          {[
            {
              icon: Dumbbell,
              title: "FUERZA + CARDIO",
              desc: "Registra hipertrofia, peso, RIR/RPE y también carrera con ritmo, distancia y zonas cardíacas.",
            },
            {
              icon: TrendingUp,
              title: "ANALÍTICAS",
              desc: "Gráficos de sobrecarga progresiva, volumen acumulado y distribución muscular por grupo.",
            },
            {
              icon: Flame,
              title: "CONSISTENCIA",
              desc: "Calendario de actividad, rachas y heat map para visualizar tu disciplina.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-surface-card p-xl">
              <item.icon className="w-8 h-8 text-primary mb-lg" />
              <h3 className="text-title-md font-display text-primary tracking-[0] mb-md">
                {item.title}
              </h3>
              <p className="text-body-md text-body tracking-[0]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <section className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-xl py-section text-center">
          <MStripe className="mb-xl w-16 mx-auto" />
          <h2 className="text-display-md font-display text-primary tracking-[0] mb-lg">
            COMIENZA TU PRÓXIMO ENTRENAMIENTO
          </h2>
          <HeroCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline py-xl px-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-md">
            <Star className="w-5 h-5 text-muted" />
            <span className="text-title-sm font-display text-muted tracking-[0]">
              SIRIUS
            </span>
          </div>
          <p className="text-caption text-muted">
            &copy; {new Date().getFullYear()} SIRIUS. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </footer>
    </div>
  );
}
