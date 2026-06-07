"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Plus,
  LogOut,
  Star,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MStripe } from "@/components/ui/m-stripe";

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: History, label: "Historial" },
    { href: "/stats", icon: BarChart3, label: "Estadísticas" },
    { href: "/workout/new", icon: Plus, label: "Nuevo" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-body">
      {/* Desktop Navbar */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-canvas border-b border-hairline h-16 items-center justify-between px-xl">
        <div className="flex items-center gap-lg">
          <Link href="/dashboard" className="flex items-center gap-md group">
            <Star className="w-5 h-5 text-primary transition-colors" />
            <span className="text-title-lg font-display text-primary tracking-[0]">
              SIRIUS
            </span>
          </Link>
          <MStripe className="w-12" />
        </div>

        <nav className="flex items-center gap-xxs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-md py-sm text-nav-link tracking-[0.5px] transition-colors rounded-none",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div>
          <Link
            href="/"
            className="flex items-center gap-xs px-md py-sm text-nav-link text-muted hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-canvas border-b border-hairline h-14 px-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Star className="w-5 h-5 text-primary" />
          <span className="text-title-md font-display text-primary tracking-[0]">
            SIRIUS
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-muted hover:text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-canvas/90 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 w-72 bg-surface-card border-l border-hairline p-xl flex flex-col z-50 transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-xl">
          <div className="flex items-center gap-md">
            <Star className="w-5 h-5 text-primary" />
            <span className="text-title-md font-display text-primary tracking-[0]">
              SIRIUS
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-muted hover:text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-xxs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-md px-md py-sm text-nav-link tracking-[0.5px] transition-colors rounded-none",
                  isActive ? "text-primary bg-surface-elevated" : "text-muted hover:text-primary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-xl border-t border-hairline">
          <Link
            href="/"
            className="flex items-center gap-md px-md py-sm text-nav-link text-muted hover:text-primary transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pt-20 p-md lg:px-xl min-h-screen max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
