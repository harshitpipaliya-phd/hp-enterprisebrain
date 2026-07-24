import { Pool, PoolConnection } from 'mysql2/promise';
export declare function getPool(): Pool;
export declare function closePool(): Promise<void>;
export declare function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T>;
