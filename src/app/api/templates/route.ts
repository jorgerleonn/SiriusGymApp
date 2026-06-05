import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (!templates) {
    return NextResponse.json([]);
  }

  for (const template of templates) {
    const { data: exercises } = await supabase
      .from("template_exercises")
      .select("*")
      .eq("template_id", template.id)
      .order("order_index", { ascending: true });
    (template as Record<string, unknown>).exercises = exercises || [];
  }

  return NextResponse.json(templates);
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { templateId } = await request.json();
  if (!templateId) {
    return NextResponse.json({ error: "templateId requerido" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
