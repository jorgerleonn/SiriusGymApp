"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, AlertCircle, CheckCircle2, Droplets, Thermometer } from "lucide-react";

const TIPS = [
  { 
    title: "Bottle Prep", 
    content: "Mix your drinks 24h in advance and keep them chilled. Shake well before filling flasks.", 
    icon: <Droplets className="w-4 h-4 text-turquoise" />,
    type: "tip" 
  },
  { 
    title: "Hydration Gap", 
    content: "If temperature exceeds 25°C, increase fluid intake by 200ml/hr to compensate for sweat loss.", 
    icon: <Thermometer className="w-4 h-4 text-orange" />,
    type: "warning" 
  },
  { 
    title: "GI Protocol", 
    content: "Start with lower carb targets in the first hour to let the gut adapt before hitting peak intake.", 
    icon: <CheckCircle2 className="w-4 h-4 text-turquoise" />,
    type: "tip" 
  },
  { 
    title: "Sodium Warning", 
    content: "Ensure you have enough electrolytes if you are a 'salty sweater' (white streaks on clothes).", 
    icon: <AlertCircle className="w-4 h-4 text-orange" />,
    type: "warning" 
  },
];

export function FuelingPlaybook() {
  return (
    <Card className="p-6 bg-surface-card border-hairline space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-turquoise" />
        <h2 className="text-xl font-bold text-primary">Science Based Fueling Playbook</h2>
      </div>

      <div className="space-y-4">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex gap-3 p-3 bg-canvas border border-hairline rounded-lg group hover:border-turquoise transition-colors">
            <div className="mt-1">{tip.icon}</div>
            <div>
              <p className="text-sm font-bold text-primary mb-1">{tip.title}</p>
              <p className="text-xs text-muted leading-relaxed">{tip.content}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
