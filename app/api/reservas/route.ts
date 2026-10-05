import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { SERVICIOS } from "../../../lib/servicios";

const send = (to: string, subject: string, text: string) =>
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, text }),
  }).catch(() => {});

export async function POST(req: Request) {
  const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
  let b: any;
  try { b = await req.json(); } catch { return bad("Datos inválidos"); }
  const { servicio, fecha, hora, nombre, celular, mail } = b ?? {};
  const s = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 1 && v.length <= max;
  if (typeof servicio !== "string" || !Object.hasOwn(SERVICIOS, servicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora) ||
      !s(nombre, 80) || !/^[\d\s+()-]{8,20}$/.test(celular ?? "") ||
      !s(mail, 120) || !/^\S+@\S+\.\S+$/.test(mail)) return bad("Revisá los datos ingresados.");

  const db = getDb();
  if (!db) return bad("Servicio de reservas no disponible.", 503);

  // Toma atómica: solo actualiza si el turno existe y sigue libre
  const { data, error } = await db.from("turnos")
    .update({ servicio, nombre: nombre.trim(), celular: celular.trim(), mail: mail.trim() })
    .eq("fecha", fecha).eq("hora", hora).is("nombre", null).select("id");
  if (error) return bad("No se pudo reservar.", 500);
  if (!data?.length) return bad("Ese turno ya fue tomado. Elegí otro horario.", 409);

  const detalle = `Servicio: ${servicio} (${SERVICIOS[servicio]})\nDía: ${fecha} a las ${hora}\nNombre: ${nombre}\nCelular: ${celular}\nMail: ${mail}`;
  await Promise.all([
    send(process.env.OWNER_EMAIL!, "Nueva reserva - Nani Nails", `Nueva reserva:\n\n${detalle}`),
    send(mail.trim(), "Tu turno en Nani Nails", `¡Hola! Tu turno quedó reservado:\n\n${detalle}\n\nSi necesitás cambiarlo, escribinos por WhatsApp.`),
  ]);
  return NextResponse.json({ ok: true });
}
