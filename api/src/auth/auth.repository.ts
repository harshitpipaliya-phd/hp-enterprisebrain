import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AuthUserRepository } from '@hpbrain/database';
import type { AuthUser } from './auth.types.js';

const scryptAsync = promisify(scrypt) as (password: string | Buffer, salt: Buffer, keylen: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, Buffer.from(salt, 'hex'), 32);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, saltHex, hashHex] = stored.split(':');
  if (alg !== 'scrypt' || !saltHex || !hashHex) return false;
  const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 32);
  const derivedHex = derived.toString('hex');
  return timingSafeEqual(Buffer.from(derivedHex), Buffer.from(hashHex));
}

interface AuthUserWithHash extends AuthUser {
  passwordHash: string;
}

export class AuthRepository {
  private repo = new AuthUserRepository();

  async findByEmail(tenantId: string, email: string): Promise<AuthUserWithHash | null> {
    const user = await this.repo.findByEmail(tenantId, email);
    if (!user) return null;
    return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role, passwordHash: user.passwordHash };
  }

  async findById(tenantId: string, id: string): Promise<AuthUserWithHash | null> {
    const user = await this.repo.findById(tenantId, id);
    if (!user) return null;
    return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role, passwordHash: user.passwordHash };
  }

  async createUser(
    tenantId: string,
    email: string,
    passwordHash: string,
    name: string,
    role: string,
  ): Promise<AuthUser> {
    const user = await this.repo.create({ tenantId, email, name, role, passwordHash });
    return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
  }

  async updatePassword(tenantId: string, id: string, passwordHash: string): Promise<void> {
    await this.repo.updatePassword(tenantId, id, passwordHash);
  }
}