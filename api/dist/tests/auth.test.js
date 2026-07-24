import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/auth/auth.service.js';
import { hashPassword, verifyPassword } from '../src/auth/auth.repository.js';
import { authMiddleware } from '../src/auth/auth.middleware.js';
function fakeSession(tenantId, rows = []) {
    const wrapped = rows.map((r) => ({ ...r, toObject: () => r }));
    const s = {
        tenantId,
        run: async (_cypher, params = {}) => {
            if (!wrapped.length && params.id && params.tenantId) {
                return { records: [{ ...params, toObject: () => params }] };
            }
            return { records: wrapped };
        },
        close: async () => { },
    };
    return s;
}
const svc = (rows) => new AuthService((t) => fakeSession(t, rows[t] ?? []));
test('hashPassword / verifyPassword roundtrip', async () => {
    const hash = await hashPassword('s3cret!');
    assert.ok(hash.startsWith('scrypt:'));
    assert.ok(await verifyPassword('s3cret!', hash));
    assert.ok(!await verifyPassword('wrong', hash));
});
test('AuthService.changePassword rejects an incorrect current password', async () => {
    const realHash = await hashPassword('correct-password');
    const s = svc({ 't1': [{ id: 'u1', tenantId: 't1', email: 'a@b.com', passwordHash: realHash, name: 'A', role: 'member' }] });
    await assert.rejects(() => s.changePassword('t1', 'u1', 'wrong-password', 'new-password-123'), /invalid_current_password/);
});
test('AuthService.changePassword rejects a nonexistent user', async () => {
    const emptySession = { tenantId: 't1', run: async () => ({ records: [] }), close: async () => { } };
    const s = new AuthService(() => emptySession);
    await assert.rejects(() => s.changePassword('t1', 'no-such-user', 'anything', 'new-password-123'), /user_not_found/);
});
test('AuthService.changePassword succeeds with the correct current password and actually changes the hash', async () => {
    const realHash = await hashPassword('correct-password');
    let updatedHash = null;
    const session = {
        tenantId: 't1',
        run: async (cypher, params) => {
            if (cypher.includes('SET')) {
                updatedHash = params.passwordHash;
                return { records: [] };
            }
            return { records: [{ id: 'u1', tenantId: 't1', email: 'a@b.com', passwordHash: realHash, name: 'A', role: 'member', toObject() { return this; } }] };
        },
        close: async () => { },
    };
    const s = new AuthService(() => session);
    await s.changePassword('t1', 'u1', 'correct-password', 'brand-new-password');
    assert.ok(updatedHash, 'updatePassword must actually be called with a new hash');
    assert.ok(await verifyPassword('brand-new-password', updatedHash), 'the new hash must verify against the new password');
});
test('AuthService.register creates user and returns tokens', async () => {
    const s = svc({});
    const tokens = await s.register({ tenantId: 't1', email: 'new@b.com', password: 's3cret!', name: 'New' });
    assert.ok(tokens.accessToken);
    assert.ok(tokens.refreshToken);
});
test('AuthService.login succeeds with correct password', async () => {
    const hash = await hashPassword('s3cret!');
    const s = svc({ 't1': [{ id: 'u1', tenantId: 't1', email: 'a@b.com', passwordHash: hash, name: 'A', role: 'admin' }] });
    const tokens = await s.login({ tenantId: 't1', email: 'a@b.com', password: 's3cret!' });
    assert.ok(tokens.accessToken.includes('.'));
    assert.ok(tokens.refreshToken.includes('.'));
});
test('AuthService.login fails with wrong password', async () => {
    const hash = await hashPassword('s3cret!');
    const s = svc({ 't1': [{ id: 'u1', tenantId: 't1', email: 'a@b.com', passwordHash: hash, name: 'A', role: 'member' }] });
    await assert.rejects(() => s.login({ tenantId: 't1', email: 'a@b.com', password: 'wrong' }), /invalid_credentials/);
});
test('AuthService.refresh returns a new access token', async () => {
    const hash = await hashPassword('s3cret!');
    const s = svc({ 't1': [{ id: 'u1', tenantId: 't1', email: 'a@b.com', passwordHash: hash, name: 'A', role: 'member' }] });
    const login = await s.login({ tenantId: 't1', email: 'a@b.com', password: 's3cret!' });
    const refreshed = await s.refresh(login.refreshToken);
    assert.ok(refreshed, 'refresh should return tokens');
    assert.ok(refreshed.accessToken.includes('.'));
    assert.ok(refreshed.refreshToken.includes('.'));
});
test('authMiddleware rejects missing token', async () => {
    let status = 999;
    const req = { headers: {} };
    const res = { status: (s) => { status = s; return res; }, json: () => { } };
    authMiddleware(req, res, () => { });
    assert.equal(status, 401);
});
test('authMiddleware rejects invalid token', async () => {
    let status = 999;
    const req = { headers: { authorization: 'Bearer bad.token.here' } };
    const res = { status: (s) => { status = s; return res; }, json: () => { } };
    authMiddleware(req, res, () => { });
    assert.equal(status, 401);
});
