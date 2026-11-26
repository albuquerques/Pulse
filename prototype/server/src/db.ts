import { Pool } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://pulse:pulse@localhost:5433/pulse_proto";

export const pool = new Pool({ connectionString: DATABASE_URL, max: 8 });

const SCHEMA = `
create table if not exists events (
  id          uuid primary key,
  user_id     text not null,
  device_id   text not null,
  type        text not null,
  payload     jsonb not null,
  local_date  date not null,
  client_ts   timestamptz not null,
  server_seq  bigserial,
  created_at  timestamptz not null default now()
);
create index if not exists events_user_seq_idx on events (user_id, server_seq);
`;

export async function migrate(): Promise<void> {
  try {
    await pool.query(SCHEMA);
  } catch (cause) {
    throw new Error(
      `cannot reach Postgres at ${DATABASE_URL}. Run "docker compose up -d" inside prototype/.`,
      { cause },
    );
  }
}
