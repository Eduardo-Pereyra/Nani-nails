create table turnos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora text not null,
  servicio text, nombre text, celular text, mail text,
  created_at timestamptz default now(),
  unique (fecha, hora)
);
-- Sin políticas: solo el servidor (service role) puede leer/escribir.
alter table turnos enable row level security;
