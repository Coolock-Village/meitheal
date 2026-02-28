-- Down migration: Drop tasks table
-- Usage: wrangler d1 migrations apply meitheal-db --direction=down

DROP TABLE IF EXISTS tasks;
