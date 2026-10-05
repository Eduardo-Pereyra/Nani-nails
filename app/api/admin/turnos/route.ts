import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getDb, hoyUY } from "../../../../lib/db";
export const dynamic = "force-dynamic";

const auth = (req: Request) => {
  const k = Buffer.from(req.headers.get("x-admin-key") ?? ""), p = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  return p.length > 0 && k.length === p.length && timingSafeEqual(k, p);
};
const no = () => NextResponse.json({ error: "No autorizado" }, { status: 401 });

export async function GET(req: Request) {
  if (!auth(req)) return no();
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Servicio de reservas no disponible." }, { status: 503 });
  const { data } = await db.from("turnos").select("*").gte("fecha", hoyUY()).order("fecha").order("hora");
  return NextResponse.json(data ?? []);
}
export async function POST(req: Request) {
  if (!auth(req)) return no();
  const { fecha, horas } = await req.json().catch(() => ({}));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Array.isArray(horas) || !horas.length || horas.length > 30 ||
      !horas.every((h: unknown) => typeof h === "string" && /^\d{2}:\d{2}$/.test(h)))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Servicio de reservas no disponible." }, { status: 503 });
  const { error } = await db.from("turnos").upsert(horas.map((hora: string) => ({ fecha, hora })),
    { onConflict: "fecha,hora", ignoreDuplicates: true });
  return error ? NextResponse.json({ error: "Error" }, { status: 500 }) : NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  if (!auth(req)) return no();
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Servicio de reservas no disponible." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.from("turnos").delete().eq("id", id).is("nombre", null); // solo libres
  return NextResponse.json({ ok: true });
}
