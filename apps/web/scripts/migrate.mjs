import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../drizzle/migrations");
const dbUrl = process.env.MEITHEAL_DB_URL ?? "file:./.data/meitheal.db";
const checkOnly = process.argv.includes("--check");

if (dbUrl.startsWith("file:")) {
  const dbPath = dbUrl.slice("file:".length);
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith("--"));
}

const client = createClient({ url: dbUrl });

await client.execute(`
  CREATE TABLE IF NOT EXISTS __meitheal_migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )
`);

const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const pending = [];

for (const file of files) {
  const existing = await client.execute({
    sql: "SELECT name FROM __meitheal_migrations WHERE name = ? LIMIT 1",
    args: [file]
  });
  if (existing.rows.length === 0) {
    pending.push(file);
  }
}

if (checkOnly) {
  if (pending.length > 0) {
    console.error(`Pending migrations: ${pending.join(", ")}`);
    process.exit(1);
  }
  console.log("Migration check passed (no pending migrations).");
  process.exit(0);
}

for (const file of pending) {
  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  const statements = splitSqlStatements(sql);

  await client.execute("BEGIN");
  try {
    for (const statement of statements) {
      await client.execute(statement);
    }

    await client.execute({
      sql: "INSERT INTO __meitheal_migrations(name, applied_at) VALUES(?, ?)",
      args: [file, Date.now()]
    });

    await client.execute("COMMIT");
    console.log(`Applied migration: ${file}`);
  } catch (error) {
    await client.execute("ROLLBACK");
    console.error(`Failed migration: ${file}`);
    throw error;
  }
}

if (pending.length === 0) {
  console.log("No migrations to apply.");
}
