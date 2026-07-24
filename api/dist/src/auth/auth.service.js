import { AuthRepository, hashPassword, verifyPassword } from './auth.repository.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './jwt.js';
export class AuthService {
    repo = new AuthRepository();
    async register(input) {
        const exists = await this.repo.findByEmail(input.tenantId, input.email);
        if (exists)
            throw new Error('email_already_exists');
        const passwordHash = await hashPassword(input.password);
        const user = await this.repo.createUser(input.tenantId, input.email, passwordHash, input.name, input.role ?? 'member');
        return {
            accessToken: createAccessToken(user),
            refreshToken: createRefreshToken(user),
        };
    }
    async changePassword(tenantId, userId, currentPassword, newPassword) {
        const user = await this.repo.findById(tenantId, userId);
        if (!user)
            throw new Error('user_not_found');
        const valid = await verifyPassword(currentPassword, user.passwordHash);
        if (!valid)
            throw new Error('invalid_current_password');
        const newHash = await hashPassword(newPassword);
        await this.repo.updatePassword(tenantId, userId, newHash);
    }
    async login(input) {
        const user = await this.repo.findByEmail(input.tenantId, input.email);
        if (!user)
            throw new Error('invalid_credentials');
        const ok = await verifyPassword(input.password, user.passwordHash);
        if (!ok)
            throw new Error('invalid_credentials');
        const { passwordHash: _pw, ...safeUser } = user;
        return {
            accessToken: createAccessToken(safeUser),
            refreshToken: createRefreshToken(safeUser),
        };
    }
    async refresh(refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        if (!payload)
            return null;
        const user = await this.repo.findById(payload.tenantId, payload.sub);
        if (!user)
            return null;
        const { passwordHash: _pw, ...safeUser } = user;
        return {
            accessToken: createAccessToken(safeUser),
            refreshToken: createRefreshToken(safeUser),
        };
    }
}
