import { NextResponse } from "next/server";
import { getDb, hoyUY } from "../../../lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Servicio de reservas no disponible." }, { status: 503 });
  const { data, error } = await db.from("turnos").select("fecha,hora").is("nombre", null)
    .gte("fecha", hoyUY()).order("fecha").order("hora");
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  const out: Record<string, string[]> = {};
  for (const t of data) (out[t.fecha] ||= []).push(t.hora);
  return NextResponse.json(out);
}
