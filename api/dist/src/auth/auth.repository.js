import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AuthUserRepository } from '@hpbrain/database';
const scryptAsync = promisify(scrypt);
export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(password, Buffer.from(salt, 'hex'), 32);
    return `scrypt:${salt}:${derived.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
    const [alg, saltHex, hashHex] = stored.split(':');
    if (alg !== 'scrypt' || !saltHex || !hashHex)
        return false;
    const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 32);
    const derivedHex = derived.toString('hex');
    return timingSafeEqual(Buffer.from(derivedHex), Buffer.from(hashHex));
}
export class AuthRepository {
    repo = new AuthUserRepository();
    async findByEmail(tenantId, email) {
        const user = await this.repo.findByEmail(tenantId, email);
        if (!user)
            return null;
        return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role, passwordHash: user.passwordHash };
    }
    async findById(tenantId, id) {
        const user = await this.repo.findById(tenantId, id);
        if (!user)
            return null;
        return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role, passwordHash: user.passwordHash };
    }
    async createUser(tenantId, email, passwordHash, name, role) {
        const user = await this.repo.create({ tenantId, email, name, role, passwordHash });
        return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
    }
    async updatePassword(tenantId, id, passwordHash) {
        await this.repo.updatePassword(tenantId, id, passwordHash);
    }
}
