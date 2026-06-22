/* =============================================
   Mathzone CRM — Authentication (JWT)
   ============================================= */

const AUTH_API_BASE = 'http://localhost:3000/api';

function parseJwt(token) {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

function isTokenExpired(token) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000 - 30000;
}

function getAccessToken() {
    return localStorage.getItem('accessToken');
}

function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

function getSession() {
    const raw = localStorage.getItem('crm_session');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function saveAuth(data) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('crm_session', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        avatar: data.user.avatar,
        loginTime: Date.now()
    }));
    localStorage.setItem('profile', JSON.stringify({
        name: data.user.name,
        role: data.user.role
    }));
}

function clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('crm_session');
    localStorage.removeItem('profile');
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const res = await fetch(`${AUTH_API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        const data = await res.json();
        if (!res.ok || !data.accessToken) {
            clearAuth();
            return false;
        }
        localStorage.setItem('accessToken', data.accessToken);
        return true;
    } catch (e) {
        clearAuth();
        return false;
    }
}

async function ensureValidSession() {
    const accessToken = getAccessToken();
    const session = getSession();
    if (!accessToken || !session) return null;

    if (isTokenExpired(accessToken)) {
        const ok = await refreshAccessToken();
        if (!ok) return null;
    }
    return getSession();
}

async function login(username, password) {
    const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Login yoki parol noto\'g\'ri');
    }
    saveAuth(data);
    return data;
}

async function isLoggedIn() {
    const session = await ensureValidSession();
    return !!session;
}

window.Auth = {
    API_BASE: AUTH_API_BASE,
    parseJwt,
    isTokenExpired,
    getAccessToken,
    getRefreshToken,
    getSession,
    saveAuth,
    clearAuth,
    refreshAccessToken,
    ensureValidSession,
    login,
    isLoggedIn
};
