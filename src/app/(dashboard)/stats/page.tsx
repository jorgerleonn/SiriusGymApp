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
import { Dumbbell, TrendingUp, BarChart3, Activity } from "lucide-react";

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
        <div className="text-sirius-textMuted">Cargando...</div>
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
        <div className="bg-sirius-surface border border-sirius-border rounded-lg p-2 sm:p-3 shadow-lg">
          <p className="text-sirius-textMuted text-xs mb-1">{label}</p>
          <p className="text-sirius-accent font-semibold text-sm sm:text-base">{payload[0].value?.toLocaleString()} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-sirius-text mb-1 sm:mb-2">Estadísticas</h1>
        <p className="text-sm sm:text-base text-sirius-textMuted">Analiza tu progreso ejercicio por ejercicio</p>
      </div>

      {/* Exercise Selector */}
      <div className="mb-6 sm:mb-8">
        <label className="block text-sm text-sirius-textMuted mb-2">Selecciona un ejercicio</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-sirius-surface border border-sirius-border rounded-xl px-4 py-3 
            text-sirius-text focus:border-sirius-accent outline-none text-base"
        >
          <option value="">-- Selecciona un ejercicio --</option>
          {exercises.map((ex) => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {selectedExercise && !loading && exerciseStats && (
        <>
          {/* KPI Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-xl shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-sirius-textMuted">Récord Personal</p>
                  <p className="text-xl sm:text-2xl font-bold text-sirius-text">{exerciseStats.pr} kg</p>
                </div>
              </div>
            </div>
            <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-sirius-accent/10 rounded-xl shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-sirius-accent" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-sirius-textMuted">Volumen Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-sirius-text">{exerciseStats.totalVolume.toLocaleString()} kg</p>
                </div>
              </div>
            </div>
            <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl shrink-0">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-sirius-textMuted">Veces realizado</p>
                  <p className="text-xl sm:text-2xl font-bold text-sirius-text">{exerciseStats.timesPerformed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 sm:gap-8">
            {/* Volume Chart */}
            <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-sirius-text mb-3 sm:mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sirius-accent shrink-0" />
                <span className="truncate">Volumen por Sesión</span>
              </h3>
              <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseStats.volumeOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#8888a0"
                      fontSize={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#8888a0"
                      fontSize={10}
                      tickFormatter={(v) => `${v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00d4ff" 
                      strokeWidth={2}
                      dot={{ fill: "#00d4ff", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#00d4ff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Max Weight Chart */}
            <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-sirius-text mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400 shrink-0" />
                <span className="truncate">Peso Máximo por Sesión</span>
              </h3>
              <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseStats.maxWeightOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#8888a0"
                      fontSize={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#8888a0"
                      fontSize={10}
                      tickFormatter={(v) => `${v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#facc15"
                      strokeWidth={2}
                      dot={{ fill: "#facc15", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#facc15" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedExercise && !loading && !exerciseStats && (
        <div className="text-center py-10 sm:py-12 text-sirius-textMuted">
          <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm sm:text-base">No hay datos para este ejercicio</p>
        </div>
      )}

      {!selectedExercise && (
        <div className="text-center py-10 sm:py-12 text-sirius-textMuted">
          <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm sm:text-base">Selecciona un ejercicio para ver sus estadísticas</p>
        </div>
      )}
    </div>
  );
}