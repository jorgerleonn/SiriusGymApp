import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, brand, color } = body;


  const supabase = createSupabaseAdmin();

  const { data: shoe, error } = await supabase
    .from("shoes")
    .update({ name, brand, color, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(shoe);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("shoes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Zapatilla eliminada" });
}
