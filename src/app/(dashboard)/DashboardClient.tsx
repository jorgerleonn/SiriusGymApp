"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, History, Plus, LogOut, Star, BarChart3, Menu, X } from "lucide-react";

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: History, label: "Historial" },
    { href: "/stats", icon: BarChart3, label: "Estadísticas" },
    { href: "/workout/new", icon: Plus, label: "Nuevo Workout" },
  ];

  return (
    <div className="min-h-screen bg-space-black">
      {/* Desktop Navbar - Fixed top */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-space-black/90 backdrop-blur-sm border-b border-space-ghost-border h-16 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Star className="w-6 h-6 text-space-spectral" />
            <span className="text-[1.25rem] font-bold tracking-[0.96px]">SIRIUS</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="px-4 py-2 text-space-spectral/70 hover:text-space-spectral transition-colors text-[0.75rem] tracking-[1.17px]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 text-space-spectral/50 hover:text-space-spectral transition-colors text-[0.75rem]">
            <LogOut className="w-4 h-4" />
            Salir
          </Link>
        </div>
      </header>

      {/* Mobile Header - Hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-space-black/90 backdrop-blur-sm border-b border-space-ghost-border h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-space-spectral" />
          <span className="text-[1rem] font-bold tracking-[0.96px]">SIRIUS</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-space-spectral/70 hover:text-space-spectral"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-space-black/90 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 right-0 w-64 bg-space-black border-l border-space-ghost-border p-6 flex flex-col z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-space-spectral" />
            <span className="text-[1rem] font-bold tracking-[0.96px]">SIRIUS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-space-spectral/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-space-spectral/70 hover:text-space-spectral transition-colors text-[0.81rem] font-bold tracking-[1.17px]"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-space-ghost-border">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-space-spectral/70 hover:text-space-spectral transition-colors text-[0.75rem]">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pt-20 p-6 pt-28 lg:px-16 min-h-screen max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}