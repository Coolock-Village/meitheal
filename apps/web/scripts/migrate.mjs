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
  const statements = [];
  let buffer = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarQuoteTag = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1] ?? "";

    if (inLineComment) {
      buffer += char;
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      buffer += char;
      if (char === "*" && next === "/") {
        buffer += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (dollarQuoteTag) {
      if (sql.startsWith(dollarQuoteTag, index)) {
        buffer += dollarQuoteTag;
        index += dollarQuoteTag.length - 1;
        dollarQuoteTag = null;
        continue;
      }
      buffer += char;
      continue;
    }

    if (inSingleQuote) {
      buffer += char;
      if (char === "'" && next === "'") {
        buffer += next;
        index += 1;
        continue;
      }
      if (char === "'" && next !== "'") {
        inSingleQuote = false;
        continue;
      }
      if (char === "\\" && next) {
        buffer += next;
        index += 1;
      }
      continue;
    }

    if (inDoubleQuote) {
      buffer += char;
      if (char === "\"" && next === "\"") {
        buffer += next;
        index += 1;
        continue;
      }
      if (char === "\"" && next !== "\"") {
        inDoubleQuote = false;
        continue;
      }
      if (char === "\\" && next) {
        buffer += next;
        index += 1;
      }
      continue;
    }

    if (char === "-" && next === "-") {
      buffer += char + next;
      index += 1;
      inLineComment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      buffer += char + next;
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      buffer += char;
      continue;
    }

    if (char === "\"") {
      inDoubleQuote = true;
      buffer += char;
      continue;
    }

    if (char === "$") {
      const tail = sql.slice(index);
      const dollarTagMatch = tail.match(/^\$\$/) ?? tail.match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/);
      if (dollarTagMatch) {
        dollarQuoteTag = dollarTagMatch[0];
        buffer += dollarQuoteTag;
        index += dollarQuoteTag.length - 1;
        continue;
      }
    }

    if (char === ";") {
      const statement = buffer.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      buffer = "";
      continue;
    }

    buffer += char;
  }

  const tail = buffer.trim();
  if (tail.length > 0) {
    statements.push(tail);
  }

  return statements;
}

const client = createClient({ url: dbUrl });

async function main() {
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
      return 1;
    }
    console.log("Migration check passed (no pending migrations).");
    return 0;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const statements = splitSqlStatements(sql);

    const tx = await client.transaction("write");
    try {
      for (const statement of statements) {
        await tx.execute(statement);
      }

      await tx.execute({
        sql: "INSERT INTO __meitheal_migrations(name, applied_at) VALUES(?, ?)",
        args: [file, Date.now()]
      });

      await tx.commit();
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await tx.rollback();
      console.error(`Failed migration: ${file}`);
      throw error;
    } finally {
      tx.close();
    }
  }

  if (pending.length === 0) {
    console.log("No migrations to apply.");
  }

  return 0;
}

let exitCode = 0;
let fatalError = null;
try {
  exitCode = await main();
} catch (error) {
  exitCode = 1;
  fatalError = error;
} finally {
  await client.close();
}

if (fatalError) {
  console.error(fatalError);
  process.exit(1);
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
