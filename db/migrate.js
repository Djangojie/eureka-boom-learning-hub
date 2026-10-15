const fs = require('node:fs/promises');
const path = require('node:path');
const { createPool } = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function main() {
  const pool = createPool();
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(160) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
    const [applied] = await pool.query('SELECT filename FROM schema_migrations');
    const completed = new Set(applied.map((row) => row.filename));
    const files = (await fs.readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      if (completed.has(file)) continue;
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
        await connection.commit();
        console.log(`已执行迁移：${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
    console.log('数据库结构已是最新版本。');
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(`数据库迁移失败：${error.message}`); process.exitCode = 1; });
