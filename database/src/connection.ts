import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config, dbSsl } from './config.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_DATABASE,
      user: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 10000,
      ssl: dbSsl ? { rejectUnauthorized: false } : undefined,
    });

    (pool as any).on('error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.error('[mysql2.Pool] background idle-client error (handled, non-fatal):', err.message);
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
