import { createHmac, timingSafeEqual } from 'node:crypto';
const JWT_SECRET = () => process.env.JWT_SECRET ?? 'change-me-in-production';
const ACCESS_TTL = 3600; // 1h
const REFRESH_TTL = 86400; // 24h
function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
function sign(payload, ttl) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ttl;
    const body = { ...payload, iat, exp };
    const enc = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(body));
    const sig = createHmac('sha256', JWT_SECRET()).update(enc).digest('base64url');
    return enc + '.' + sig;
}
function verify(token) {
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    const [h, p, s] = parts;
    const expected = createHmac('sha256', JWT_SECRET()).update(`${h}.${p}`).digest('base64url');
    if (s.length !== expected.length)
        return null;
    if (!timingSafeEqual(Buffer.from(s), Buffer.from(expected)))
        return null;
    try {
        const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
        if (typeof payload.exp !== 'number' || Date.now() / 1000 > payload.exp)
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
export function createAccessToken(user) {
    return sign({ sub: user.id, tenantId: user.tenantId, role: user.role, typ: 'access' }, ACCESS_TTL);
}
export function createRefreshToken(user) {
    return sign({ sub: user.id, tenantId: user.tenantId, typ: 'refresh' }, REFRESH_TTL);
}
export function verifyAccessToken(token) {
    const p = verify(token);
    if (!p || p.typ !== 'access')
        return null;
    return { sub: String(p.sub), tenantId: String(p.tenantId), role: String(p.role) };
}
export function verifyRefreshToken(token) {
    const p = verify(token);
    if (!p || p.typ !== 'refresh')
        return null;
    return { sub: String(p.sub), tenantId: String(p.tenantId) };
}
