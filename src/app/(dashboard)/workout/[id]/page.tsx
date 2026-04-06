"use server";

import { getWorkout } from "@/lib/queries";
import { notFound } from "next/navigation";
import WorkoutDetailClient from "./WorkoutDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutDetailPage({ params }: PageProps) {
  const { id } = await params;
  const workout = await getWorkout(id);

  if (!workout) {
    notFound();
  }

  return <WorkoutDetailClient workout={workout} />;
}