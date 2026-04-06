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
    <div className="min-h-screen bg-sirius-bg">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sirius-surface border-b border-sirius-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-sirius-accent" />
          <span className="text-xl font-bold text-sirius-text">SIRIUS</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-sirius-textMuted hover:text-sirius-accent"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-sirius-surface border-r border-sirius-border p-6 flex-col fixed h-full">
        <div className="flex items-center gap-2 mb-10">
          <Star className="w-6 h-6 text-sirius-accent" />
          <span className="text-xl font-bold text-sirius-text">SIRIUS</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sirius-textMuted hover:bg-sirius-surfaceElevated hover:text-sirius-text transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-sirius-border">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sirius-textMuted hover:text-sirius-danger transition-colors">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`lg:hidden fixed inset-y-0 right-0 w-64 bg-sirius-surface border-l border-sirius-border p-6 flex flex-col z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-sirius-accent" />
            <span className="text-xl font-bold text-sirius-text">SIRIUS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-sirius-textMuted">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sirius-textMuted hover:bg-sirius-surfaceElevated hover:text-sirius-text transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-sirius-border">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sirius-textMuted hover:text-sirius-danger transition-colors">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 p-4 pt-20 lg:pt-8 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}