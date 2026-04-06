"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Dumbbell, TrendingUp, BarChart3 } from "lucide-react";

interface chartData {
  date: string;
  value: number;
}

interface ExerciseStats {
  pr: number;
  totalVolume: number;
  timesPerformed: number;
  volumeOverTime: chartData[];
  maxWeightOverTime: chartData[];
}

export default function StatsPage() {
  const { user, isLoaded } = useUser();
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetch("/api/stats")
        .then(res => res.json())
        .then(data => {
          if (data.exercises) {
            setExercises(data.exercises);
          }
        });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (selectedExercise && user) {
      setLoading(true);
      fetch(`/api/stats?exercise=${encodeURIComponent(selectedExercise)}`)
        .then(res => res.json())
        .then(data => {
          if (data.stats) {
            setExerciseStats(data.stats);
          } else {
            setExerciseStats(null);
          }
          setLoading(false);
        });
    } else {
      setExerciseStats(null);
    }
  }, [selectedExercise, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-space-spectral/50 text-[0.75rem] tracking-[1px] uppercase">Cargando...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-space-black border border-space-ghost-border rounded-[4px] p-3">
          <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">{label}</p>
          <p className="text-[0.8125rem] font-bold text-space-spectral tracking-[1.17px]">{payload[0].value?.toLocaleString()} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header - No container */}
      <div className="mb-10 pt-4">
        <h1 className="text-[2rem] font-bold text-space-spectral mb-2 tracking-[0.96px]">Estadísticas</h1>
        <p className="text-[0.875rem] text-space-spectral/50" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Analiza tu progreso ejercicio por ejercicio</p>
      </div>

      {/* Exercise Selector */}
      <div className="mb-8">
        <label className="block text-[0.625rem] text-space-spectral/50 mb-2 tracking-[1px] uppercase">Selecciona un ejercicio</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-space-black border border-space-ghost-border rounded-[4px] px-4 py-3 
            text-space-spectral focus:border-space-ghost-border outline-none text-[0.8125rem] tracking-[1.17px]"
        >
          <option value="">Selecciona un ejercicio</option>
          {exercises.map((ex) => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {selectedExercise && !loading && exerciseStats && (
        <>
          {/* KPI Stats - Grid with dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-space-ghost-border mb-8">
            <div className="bg-space-black p-6">
              <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Récord Personal</p>
              <p className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{exerciseStats.pr} kg</p>
            </div>
            <div className="bg-space-black p-6">
              <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Volumen Total</p>
              <p className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{exerciseStats.totalVolume.toLocaleString()} kg</p>
            </div>
            <div className="bg-space-black p-6">
              <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Veces realizado</p>
              <p className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{exerciseStats.timesPerformed}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-8">
            {/* Volume Chart */}
            <div>
              <h3 className="text-[0.8125rem] font-bold text-space-spectral mb-4 tracking-[1.17px] flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Volumen por Sesión
              </h3>
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseStats.volumeOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,240,250,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="rgba(240,240,250,0.5)"
                      fontSize={10}
                      tick={{ fill: 'rgba(240,240,250,0.5)', letterSpacing: '1px' }}
                    />
                    <YAxis 
                      stroke="rgba(240,240,250,0.5)"
                      fontSize={10}
                      tick={{ fill: 'rgba(240,240,250,0.5)', letterSpacing: '1px' }}
                      tickFormatter={(v) => `${v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0653b6" 
                      strokeWidth={2}
                      dot={{ fill: "#0653b6", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#0653b6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Max Weight Chart */}
            <div>
              <h3 className="text-[0.8125rem] font-bold text-space-spectral mb-4 tracking-[1.17px] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Peso Máximo por Sesión
              </h3>
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseStats.maxWeightOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,240,250,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="rgba(240,240,250,0.5)"
                      fontSize={10}
                      tick={{ fill: 'rgba(240,240,250,0.5)', letterSpacing: '1px' }}
                    />
                    <YAxis 
                      stroke="rgba(240,240,250,0.5)"
                      fontSize={10}
                      tick={{ fill: 'rgba(240,240,250,0.5)', letterSpacing: '1px' }}
                      tickFormatter={(v) => `${v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0653b6"
                      strokeWidth={2}
                      dot={{ fill: "#0653b6", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#0653b6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedExercise && !loading && !exerciseStats && (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-space-spectral/30 mx-auto mb-4" />
          <p className="text-space-spectral/50 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>No hay datos para este ejercicio</p>
        </div>
      )}

      {!selectedExercise && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-space-spectral/30 mx-auto mb-4" />
          <p className="text-space-spectral/50 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Selecciona un ejercicio para ver sus estadísticas</p>
        </div>
      )}
    </div>
  );
}