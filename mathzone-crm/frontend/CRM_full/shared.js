/* =============================================
   Mathzone CRM v8.1 — Improved (shared.js)
   Security + DataService integrated
   ============================================= */

if (!window.Auth) {
    document.write('<script src="auth.js"><\/script>');
}

// Load DataService
if (!window.DataService) {
    const script = document.createElement('script');
    script.src = 'dataService.js';
    document.head.appendChild(script);
}

/* ── 1. AUTH GUARD + RBAC ROUTE GUARD ── */
const PAGE_PERMISSIONS = {
    'dashboard.html':     ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'leads.html':         ['Administrator', 'Resepshyonist'],
    'teachers.html':      ['Administrator'],
    'groups.html':        ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'group-detail.html':  ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'student.html':       ['Administrator', 'Resepshyonist'],
    'student-detail.html':['Administrator', 'Resepshyonist', "O'qituvchi"],
    'finance.html':       ['Administrator'],
    'reports.html':       ['Administrator'],
    'gamification.html':  ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'timetable.html':     ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'salary.html':        ['Administrator'],
    'exam.html':          ['Administrator', 'Resepshyonist', "O'qituvchi"],
    'certificate.html':   ['Administrator', 'Resepshyonist'],
    'settings.html':      ['Administrator', 'Resepshyonist'],
    'receipt.html':       ['Administrator', 'Resepshyonist'],
    'parent.html':        'public',
};

async function authGuard() {
    if (!window.Auth) {
        window.location.href = 'login.html';
        return null;
    }
    const s = await Auth.ensureValidSession();
    if (!s) {
        window.location.href = 'login.html';
        return null;
    }
    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    const allowed = PAGE_PERMISSIONS[page];
    if (allowed && allowed !== 'public' && !allowed.includes(s.role)) {
        showAccessDenied(s.role, page);
        return null;
    }
    return s;
}

function showAccessDenied(role, page) {
    document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f8fb;font-family:system-ui,sans-serif;">
        <div style="text-align:center;background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 8px 30px rgba(0,0,0,0.08);max-width:400px;">
            <div style="width:64px;height:64px;background:#fbeaea;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">🔒</div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#1a1f24;">Ruxsat yo'q</h2>
            <p style="color:#626976;font-size:14px;margin-bottom:24px;">Siz (<strong>${sanitizeHTML(role)}</strong>) bu sahifani ko'rish huquqiga ega emassiz.</p>
            <a href="dashboard.html" style="background:#ff7a00;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">Dashboard ga qaytish</a>
        </div>
    </div>`;
}

function logout() {
    if (window.Auth) Auth.clearAuth();
    else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('crm_session');
        localStorage.removeItem('profile');
    }
    window.location.href = 'login.html';
}

/* ── 2. NAVBAR profil yangilash ── */
function updateNavbarProfile() {
    const raw = localStorage.getItem('crm_session');
    if (!raw) return;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return; }
    const nameEl = document.getElementById('navbar-name');
    const roleEl = document.getElementById('navbar-role');
    const avatarEl = document.getElementById('navbar-avatar');
    if (nameEl) nameEl.innerText = s.name;
    if (roleEl) roleEl.innerText = s.role;
    if (avatarEl) avatarEl.innerText = s.avatar || s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
}

/* ── 3. DARK MODE ── */
function initDarkMode() {
    const isDark = localStorage.getItem('crm_dark') === '1';
    if (isDark) document.body.classList.add('dark-mode');
    const btn = document.getElementById('dark-toggle');
    if (btn) {
        btn.innerHTML = isDark ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
        btn.onclick = () => {
            const on = document.body.classList.toggle('dark-mode');
            localStorage.setItem('crm_dark', on ? '1' : '0');
            btn.innerHTML = on ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
        };
    }
}

/* ── 4. XABARNOMALAR (Notifications) ── */
const NOTIF_TYPES = {
    debt:     { icon: 'ti-alert-triangle', color: '#d63939', bg: '#fbeaea' },
    payment:  { icon: 'ti-cash',           color: '#2bab41', bg: '#eafbee' },
    trial:    { icon: 'ti-presentation',   color: '#ff7a00', bg: '#fff0e6' },
    info:     { icon: 'ti-info-circle',    color: '#206bc4', bg: '#e8f0fd' },
    reminder: { icon: 'ti-bell',           color: '#d63939', bg: '#fbeaea' },
};

function buildNotifications() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const notifs = [];

    // Qarzdorlar
    students.filter(s => s.balance < 0).forEach(s => {
        notifs.push({ type: 'debt', text: `${s.name} qarzdor`, sub: Math.abs(s.balance).toLocaleString() + ' UZS', id: s.id });
    });

    // Sinov darsidagilar
    students.filter(s => s.status === 'Sinov darsida').forEach(s => {
        notifs.push({ type: 'trial', text: `${s.name} sinov darsida`, sub: 'Qaror qabul qilish kerak', id: s.id });
    });

    // Muzlatilganlar
    students.filter(s => s.status === 'Muzlatilgan').forEach(s => {
        notifs.push({ type: 'info', text: `${s.name} muzlatilgan`, sub: 'Guruh: ' + s.group, id: s.id });
    });

    // Eslatmalar — muddati yetgan yoki o'tgan (masalan: "to'lov qilaman" deb va'da bergan kun)
    const today = new Date(); today.setHours(0,0,0,0);
    students.forEach(s => {
        const notes = JSON.parse(localStorage.getItem('notes_' + s.id) || '[]');
        notes.filter(n => !n.done && n.reminderDate).forEach(n => {
            const rDate = new Date(n.reminderDate);
            if (rDate <= today) {
                const isOverdue = rDate < today;
                notifs.push({
                    type: 'reminder',
                    text: `${s.name}: eslatma`,
                    sub: (isOverdue ? "Muddati o'tdi — " : "Bugun — ") + n.text.slice(0, 60),
                    id: s.id
                });
            }
        });
    });

    return notifs.slice(0, 15);
}

function renderNotifications() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const notifs = buildNotifications();
    const badge = document.querySelector('.notif-badge');
    if (badge) badge.style.display = notifs.length ? 'block' : 'none';

    if (!notifs.length) {
        panel.innerHTML = '<div style="padding:20px;text-align:center;color:#99a1ad;font-size:13px;"><i class="ti ti-bell-off" style="font-size:28px;display:block;margin-bottom:8px;"></i>Xabarnoma yo\'q</div>';
        return;
    }

    panel.innerHTML = notifs.map(n => {
        const t = NOTIF_TYPES[n.type];
        return `<div class="notif-item unread">
            <div class="notif-icon" style="background:${t.bg};color:${t.color}"><i class="ti ${t.icon}"></i></div>
            <div class="notif-text"><strong>${sanitizeHTML(n.text)}</strong><span>${sanitizeHTML(n.sub)}</span></div>
        </div>`;
    }).join('');
}

function initNotifications() {
    const btn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    if (!btn || !dropdown) return;
    renderNotifications();
    btn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    };
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', e => e.stopPropagation());
}

/* ── 5. GLOBAL QIDIRUV (Cmd+K) ── */
function initGlobalSearch() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;

    const input = document.getElementById('search-global-input');
    const results = document.getElementById('search-global-results');

    function openSearch() { overlay.classList.add('open'); input && setTimeout(() => input.focus(), 50); }
    function closeSearch() { overlay.classList.remove('open'); if(input) input.value = ''; if(results) results.innerHTML = ''; }

    document.getElementById('search-global-btn')?.addEventListener('click', openSearch);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });

    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
        if (e.key === 'Escape') closeSearch();
        if (e.key === '?') { showShortcuts(); }
    });

    if (!input || !results) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (!q) { results.innerHTML = ''; return; }

        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const groups   = JSON.parse(localStorage.getItem('groups')   || '[]');
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const leads    = JSON.parse(localStorage.getItem('leads')    || '[]');

        const hits = [];
        students.filter(s => s.name.toLowerCase().includes(q) || (s.phone||'').includes(q))
            .slice(0,4).forEach(s => hits.push({ icon:'ti-backpack', label: s.name, sub: s.phone, href: `student-detail.html?id=${s.id}` }));
        groups.filter(g => g.name.toLowerCase().includes(q))
            .slice(0,3).forEach(g => hits.push({ icon:'ti-books', label: g.name, sub: g.teacher, href: `group-detail.html?group=${encodeURIComponent(g.name)}` }));
        teachers.filter(t => t.name.toLowerCase().includes(q))
            .slice(0,3).forEach(t => hits.push({ icon:'ti-school', label: t.name, sub: t.subject, href: 'teachers.html' }));
        leads.filter(l => l.name.toLowerCase().includes(q) || (l.phone||'').includes(q))
            .slice(0,3).forEach(l => hits.push({ icon:'ti-users-group', label: l.name, sub: l.phone, href: 'leads.html' }));

        if (!hits.length) {
            results.innerHTML = '<div style="padding:16px 18px;font-size:13px;color:#99a1ad;">Natija topilmadi</div>';
            return;
        }
        results.innerHTML = hits.map(h =>
            `<a class="search-result-item" href="${h.href}">
                <i class="ti ${h.icon}"></i>
                <div><div style="font-size:13px;">${sanitizeHTML(h.label)}</div><div style="font-size:11px;color:#99a1ad;">${sanitizeHTML(h.sub||'')}</div></div>
            </a>`
        ).join('');
    });
}

/* ── 6. KEYBOARD SHORTCUTS ── */
function showShortcuts() {
    document.getElementById('shortcuts-modal')?.classList.add('open');
}
function initShortcuts() {
    const modal = document.getElementById('shortcuts-modal');
    if (!modal) return;
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
    document.addEventListener('keydown', e => {
        if (modal.classList.contains('open') && e.key === 'Escape') modal.classList.remove('open');
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const map = { 'd':'dashboard.html','l':'leads.html','t':'teachers.html','g':'groups.html','s':'student.html','f':'finance.html','r':'reports.html' };
        if (map[e.key] && !e.metaKey && !e.ctrlKey) window.location.href = map[e.key];
    });
}

/* ── 7. EXCEL EXPORT ── */
function exportTableToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('th,td').forEach(td => row.push(td.innerText.trim()));
        rows.push(row);
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (filename || 'export') + '.csv';
    a.click(); URL.revokeObjectURL(url);
}

function exportStudentsToExcel() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const rows = [['ID','Ism','Telefon','Guruh','Qo\'shilgan sana','Balans','Holati']];
    students.forEach(s => rows.push([s.id, s.name, s.phone, s.group, s.startDate, s.balance, s.status]));
    downloadCSV(rows, 'talabalar');
}

function exportFinanceToExcel() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const rows = [['Ism','Guruh','Balans','Holati']];
    students.forEach(s => rows.push([s.name, s.group, s.balance, s.balance >= 0 ? "To'langan" : "Qarzdor"]));
    downloadCSV(rows, 'moliya_hisobot');
}

function downloadCSV(rows, filename) {
    const bom = '\uFEFF';
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename + '.csv';
    a.click(); URL.revokeObjectURL(url);
}

/* ── 8. MULTI-BRANCH filial ── */
function initBranchSelector() {
    const sel = document.getElementById('branch-selector');
    if (!sel) return;
    const branches = JSON.parse(localStorage.getItem('branches') || '["Yunusobod filiali","Sergeli filiali","Chilonzor filiali"]');
    const current = localStorage.getItem('crm_branch') || branches[0];
    sel.innerHTML = branches.map(b => `<option${b===current?' selected':''}>${b}</option>`).join('');
    sel.onchange = () => {
        localStorage.setItem('crm_branch', sel.value);
        // Filial nomini navbar breadcrumb da yangilash
        document.querySelectorAll('.branch-label').forEach(el => el.innerText = sel.value);
    };
}

function getCurrentBranch() {
    const branches = JSON.parse(localStorage.getItem('branches') || '["Yunusobod filiali"]');
    return localStorage.getItem('crm_branch') || branches[0];
}

/* ── 9. ACTIVITY LOG ── */
function logActivity(action, detail) {
    const session = JSON.parse(localStorage.getItem('crm_session') || '{}');
    const log = JSON.parse(localStorage.getItem('crm_activity_log') || '[]');
    log.unshift({
        time: new Date().toISOString(),
        user: session.name || 'Noma\'lum',
        role: session.role || '',
        action, detail
    });
    localStorage.setItem('crm_activity_log', JSON.stringify(log.slice(0, 200)));
}

/* ── 10. BOSHLASH (DOMContentLoaded) ── */
document.addEventListener('DOMContentLoaded', async function() {
    // Auth tekshirish (login.html bundan mustasno)
    if (!window.location.pathname.includes('login.html')) {
        const s = await authGuard();
        if (s) updateNavbarProfile();
    }
    initDarkMode();
    initNotifications();
    initGlobalSearch();
    initShortcuts();
    initBranchSelector();
    initPhoneInputs();
    checkFirstTimeOnboarding();
    // Kunlik backup eslatmasi (dashboard da)
    if (window.location.pathname.includes('dashboard.html')) {
        setTimeout(() => { if(typeof autoBackupCheck==='function') autoBackupCheck(); }, 2000);
    }

    // Listen for data changes from other tabs
    window.addEventListener('crm-data-changed', () => {
        if (typeof renderNotifications === 'function') renderNotifications();
    });
});

/* ── 11. BACKUP / ZAXIRA NUSXA ──
   MUHIM TUZATISH: avval faqat 10 ta qotib qolgan kalit (students, groups...) saqlanardi.
   Yangi modullar (uy vazifa, baho, testlar, jadval, ish haqi, arxiv va h.k.) backup'ga umuman kirmasdi —
   ya'ni "zaxira nusxa" olingan taqdirda ham ko'p ma'lumot saqlanmay qolardi.
   Endi localStorage'dagi BARCHA kalitlar avtomatik aniqlanadi va saqlanadi. */
function backupAllData() {
    // Faqat sessiya/UI holatiga oid vaqtinchalik kalitlar backup'dan chiqarib tashlanadi
    const EXCLUDED_KEYS = ['crm_session', 'accessToken', 'refreshToken', 'profile', 'crm_dark', 'crm_onboarding_done', 'parent_session'];
    const backup = { version: 3, exportedAt: new Date().toISOString(), data: {} };

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (EXCLUDED_KEYS.includes(key)) continue;
        const val = localStorage.getItem(key);
        if (val === null) continue;
        try {
            backup.data[key] = JSON.parse(val);
        } catch (e) {
            // JSON bo'lmagan oddiy matn qiymat (masalan sana string) — xom holda belgilab saqlaymiz
            backup.data[key] = { __raw: val };
        }
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date();
    a.href = url;
    a.download = `mathzone_backup_${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof logActivity === 'function') logActivity('Backup', `Ma'lumotlar zaxira nusxasi yaratildi (${Object.keys(backup.data).length} ta jadval)`);
}

function restoreBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                if (!backup.data) { reject('Noto\'g\'ri backup fayli — "data" maydoni topilmadi'); return; }
                Object.entries(backup.data).forEach(([k, v]) => {
                    // __raw bilan belgilangan qiymatlar — JSON bo'lmagan xom matn sifatida tiklanadi
                    if (v && typeof v === 'object' && '__raw' in v && Object.keys(v).length === 1) {
                        localStorage.setItem(k, v.__raw);
                    } else {
                        localStorage.setItem(k, JSON.stringify(v));
                    }
                });
                logActivity('Restore', `Backup tiklandi: ${backup.exportedAt} (${Object.keys(backup.data).length} ta jadval)`);
                resolve(backup.exportedAt);
            } catch(err) { reject('Fayl o\'qishda xato: ' + err.message); }
        };
        reader.readAsText(file);
    });
}

function autoBackupCheck() {
    const lastBackup = localStorage.getItem('last_backup_date');
    const today = new Date().toDateString();
    if (lastBackup !== today) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        if (students.length > 0) {
            localStorage.setItem('last_backup_date', today);
            // Auto-backup notification (har kuni 1 marta)
            setTimeout(() => {
                const notif = document.createElement('div');
                notif.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1e1e2d;color:#fff;border-radius:12px;padding:14px 18px;font-size:13px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2);display:flex;gap:10px;align-items:center;max-width:320px;';
                notif.innerHTML = '<i class="ti ti-database" style="font-size:20px;color:#ff7a00;flex-shrink:0;"></i><div style="flex:1;"><div style="font-weight:600;margin-bottom:2px;">Kunlik backup</div><div style="opacity:.7;font-size:12px;">Ma\'lumotlarni zaxiralash tavsiya etiladi</div></div><button onclick="backupAllData();this.closest(\'div\').remove();" style="background:#ff7a00;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;white-space:nowrap;">Saqlash</button><button onclick="this.closest(\'div\').remove();" style="background:rgba(255,255,255,.1);color:#fff;border:none;border-radius:8px;padding:6px 8px;cursor:pointer;font-size:16px;">×</button>';
                document.body.appendChild(notif);
                setTimeout(() => { if(notif.parentNode) notif.remove(); }, 15000);
            }, 3000);
        }
    }
}

/* ── 12. CHIROYLI CONFIRM MODAL (browser confirm() o'rniga) ── */
function showConfirmModal(opts) {
    const {
        title = "Tasdiqlash",
        message = "Davom etishni xohlaysizmi?",
        confirmLabel = "Tasdiqlash",
        cancelLabel = "Bekor qilish",
        danger = false,
        onConfirm = () => {},
        onCancel = () => {}
    } = opts;

    const existing = document.getElementById('crm-confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'crm-confirm-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;animation:crmFadeIn .15s ease;';

    const iconBg = danger ? '#fbeaea' : '#fff0e6';
    const iconColor = danger ? '#d63939' : '#ff7a00';
    const btnBg = danger ? '#d63939' : '#ff7a00';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:28px;width:380px;max-width:100%;box-shadow:0 20px 50px rgba(0,0,0,.2);animation:crmPopIn .18s ease;">
            <div style="width:48px;height:48px;border-radius:50%;background:${iconBg};display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <i class="ti ${danger ? 'ti-alert-triangle' : 'ti-help-circle'}" style="font-size:24px;color:${iconColor};"></i>
            </div>
            <div style="font-size:17px;font-weight:700;color:#1a1f24;margin-bottom:8px;">${title}</div>
            <div style="font-size:14px;color:#626976;line-height:1.6;margin-bottom:22px;">${message}</div>
            <div style="display:flex;gap:10px;">
                <button id="crm-confirm-cancel" style="flex:1;background:#f1f3f7;color:#3d4555;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;">${cancelLabel}</button>
                <button id="crm-confirm-ok" style="flex:1;background:${btnBg};color:#fff;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;">${confirmLabel}</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('crm-confirm-cancel').onclick = () => { close(); onCancel(); };
    document.getElementById('crm-confirm-ok').onclick = () => { close(); onConfirm(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) { close(); onCancel(); } });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { close(); onCancel(); document.removeEventListener('keydown', escHandler); }
    });
}

/* ── 13. YAGONA TOAST TIZIMI (alert() o'rniga) ── */
function showToast(message, type = 'info', duration = 3500) {
    const TYPES = {
        success: { bg: '#2bab41', icon: 'ti-circle-check' },
        danger:  { bg: '#d63939', icon: 'ti-circle-x' },
        warning: { bg: '#ff7a00', icon: 'ti-alert-triangle' },
        info:    { bg: '#206bc4', icon: 'ti-info-circle' }
    };
    const t = TYPES[type] || TYPES.info;

    let container = document.getElementById('crm-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'crm-toast-container';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10001;display:flex;flex-direction:column;gap:10px;max-width:340px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `background:${t.bg};color:#fff;border-radius:12px;padding:13px 18px;font-size:13px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;align-items:center;gap:10px;animation:crmSlideIn .25s ease;`;
    toast.innerHTML = `<i class="ti ${t.icon}" style="font-size:18px;flex-shrink:0;"></i><span style="flex:1;">${message}</span><button style="background:none;border:none;color:#fff;opacity:.7;cursor:pointer;font-size:16px;padding:0;line-height:1;" onclick="this.closest('div').remove()">×</button>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity .3s, transform .3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Animatsiya keyframe larini bir marta inject qilish
(function injectCrmAnimations() {
    if (document.getElementById('crm-anim-styles')) return;
    const style = document.createElement('style');
    style.id = 'crm-anim-styles';
    style.textContent = `
        @keyframes crmFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes crmPopIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes crmSlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
    `;
    document.head.appendChild(style);
})();

/* ── 14. AVTOMATIK GAMIFIKATSIYA BALLARI ── */
// Boshqa modullar (baho, test, to'lov) ushbu funksiyani chaqirib avtomatik ball beradi
function awardPoints(studentId, amount, reason) {
    if (!studentId || !amount) return;
    const points = JSON.parse(localStorage.getItem('points') || '{}');
    points[studentId] = (points[studentId] || 0) + amount;
    localStorage.setItem('points', JSON.stringify(points));

    // Ball tarixini ham saqlaymiz (gamifikatsiya sahifasida ko'rsatish uchun)
    const log = JSON.parse(localStorage.getItem('points_log') || '[]');
    log.unshift({ studentId, amount, reason, date: new Date().toISOString() });
    localStorage.setItem('points_log', JSON.stringify(log.slice(0, 300)));

    // Kichik bildirishnoma (agar showToast mavjud bo'lsa)
    if (typeof showToast === 'function' && amount > 0) {
        showToast(`<i class="ti ti-star me-1"></i>+${amount} ball: ${reason}`, 'success', 2500);
    }
}

// Baho asosida avtomatik ball: 5="A'lo"=+10, 4="Yaxshi"=+5, 3=+2, 2=0
function awardPointsForGrade(studentId, score, subject) {
    const map = { '5': 10, '4': 5, '3': 2, '2': 0 };
    const amount = map[String(score)] || 0;
    if (amount > 0) awardPoints(studentId, amount, `${subject || 'Fan'} bahosi: ${score}`);
}

// Test natijasi asosida avtomatik ball
function awardPointsForExam(studentId, scorePct, examTitle) {
    let amount = 0;
    if (scorePct >= 90) amount = 15;
    else if (scorePct >= 70) amount = 8;
    else if (scorePct >= 50) amount = 3;
    if (amount > 0) awardPoints(studentId, amount, `Test natijasi: ${scorePct}% (${examTitle || 'test'})`);
}

// Vaqtida to'lov uchun avtomatik ball (oyning 1-10 kunlari ichida = vaqtida)
function awardPointsForPayment(studentId, amount) {
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth <= 10 && amount > 0) {
        awardPoints(studentId, 5, "Vaqtida to'lov");
    }
}

/* ── 15. TELEFON RAQAM VALIDATSIYASI VA NIQOBI ── */
// O'zbekiston formati: +998 90 123 45 67
function formatPhoneInput(input) {
    let digits = input.value.replace(/\D/g, '');
    if (digits.startsWith('998')) digits = digits.substring(3);
    digits = digits.substring(0, 9); // Faqat 9 ta raqam (90 123 45 67)

    let formatted = '+998';
    if (digits.length > 0) formatted += ' ' + digits.substring(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);

    input.value = formatted;
}

function isValidUzPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    // 998 + 9 ta raqam = 12 ta raqam, yoki faqat 9 ta raqam (998 siz)
    return digits.length === 12 || digits.length === 9;
}

function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('998')) digits = digits.substring(3);
    digits = digits.substring(0, 9);
    return digits.length === 9 ? '+998' + digits : phone;
}

// Sahifadagi barcha tel inputlarga avtomatik niqob ulash
function initPhoneInputs() {
    document.querySelectorAll('input[data-phone-mask]').forEach(input => {
        input.addEventListener('input', () => formatPhoneInput(input));
        input.setAttribute('maxlength', '17');
        input.setAttribute('inputmode', 'numeric');
    });
}

/* ── 16. ONBOARDING TUR (yangi foydalanuvchilar uchun) ── */
const ONBOARDING_STEPS = [
    {
        selector: '.sidebar-fixed',
        title: "Xush kelibsiz, Mathzone CRM!",
        text: "Bu — asosiy navigatsiya paneli. Sichqonchani ustiga olib borsangiz kengayadi va barcha bo'limlar nomi ko'rinadi.",
        position: 'right'
    },
    {
        selector: 'a[href="leads.html"]',
        title: "1-qadam: Lidlar",
        text: "Yangi mijozlar (lidlar) shu yerga kelib tushadi. Instagram, Telegram yoki tanish orqali kelganlarni shu yerdan kuzating.",
        position: 'right'
    },
    {
        selector: 'a[href="groups.html"]',
        title: "2-qadam: Guruhlar yarating",
        text: "Talabalarni qabul qilishdan oldin avval o'quv guruhlarini yarating — fan, o'qituvchi, narx va jadval bilan.",
        position: 'right'
    },
    {
        selector: 'a[href="student.html"]',
        title: "3-qadam: Talabalar",
        text: "Talabalarni qo'shing, to'lovlarini kuzating, davomatini belgilang — barchasi shu bo'limda.",
        position: 'right'
    },
    {
        selector: 'a[href="finance.html"]',
        title: "4-qadam: Moliya",
        text: "Barcha to'lovlar, qarzdorlar va daromad hisobotlari shu yerda jamlangan.",
        position: 'right'
    },
    {
        selector: '#search-global-btn',
        title: "Tezkor maslahat",
        text: "Istalgan vaqtda <kbd style='background:#f1f3f7;padding:2px 6px;border-radius:4px;'>Ctrl+K</kbd> bosib talaba, guruh yoki o'qituvchini tezda qidiring!",
        position: 'bottom'
    }
];

function startOnboardingTour() {
    let stepIndex = 0;
    const overlay = document.createElement('div');
    overlay.id = 'crm-onboarding-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10500;pointer-events:none;';
    document.body.appendChild(overlay);

    function renderStep() {
        overlay.innerHTML = '';
        // Tugagan stepларни o'tkazib yuborish (element mavjud bo'lmasa)
        while (stepIndex < ONBOARDING_STEPS.length && !document.querySelector(ONBOARDING_STEPS[stepIndex].selector)) {
            stepIndex++;
        }
        if (stepIndex >= ONBOARDING_STEPS.length) { endTour(); return; }

        const step = ONBOARDING_STEPS[stepIndex];
        const target = document.querySelector(step.selector);
        if (!target) { endTour(); return; }

        const rect = target.getBoundingClientRect();

        // Qorong'u fon
        const dim = document.createElement('div');
        dim.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);pointer-events:auto;';
        overlay.appendChild(dim);

        // Highlight halqa
        const highlight = document.createElement('div');
        highlight.style.cssText = `position:fixed;top:${rect.top-6}px;left:${rect.left-6}px;width:${rect.width+12}px;height:${rect.height+12}px;border:3px solid #ff7a00;border-radius:12px;box-shadow:0 0 0 4000px rgba(0,0,0,.55);pointer-events:none;transition:all .25s ease;z-index:10501;`;
        overlay.appendChild(highlight);
        dim.style.background = 'transparent';

        // Tooltip karta
        const card = document.createElement('div');
        let top, left;
        if (step.position === 'right') {
            top = Math.max(rect.top, 20);
            left = rect.right + 20;
        } else {
            top = rect.bottom + 16;
            left = Math.max(rect.left - 100, 20);
        }
        // Ekrandan chiqib ketmasligi uchun moslashtirish
        const cardWidth = 320;
        if (left + cardWidth > window.innerWidth - 16) left = window.innerWidth - cardWidth - 16;
        if (top + 200 > window.innerHeight) top = window.innerHeight - 220;

        card.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${cardWidth}px;background:#fff;border-radius:14px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.25);pointer-events:auto;z-index:10502;animation:crmPopIn .2s ease;`;
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="background:#fff0e6;color:#c85a00;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${stepIndex+1} / ${ONBOARDING_STEPS.length}</span>
                <button id="crm-tour-skip" style="background:none;border:none;color:#99a1ad;font-size:12px;cursor:pointer;">O'tkazib yuborish</button>
            </div>
            <div style="font-size:15px;font-weight:700;color:#1a1f24;margin-bottom:6px;">${step.title}</div>
            <div style="font-size:13px;color:#626976;line-height:1.6;margin-bottom:16px;">${step.text}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                ${stepIndex > 0 ? `<button id="crm-tour-prev" style="background:#f1f3f7;color:#3d4555;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;">Orqaga</button>` : ''}
                <button id="crm-tour-next" style="background:#ff7a00;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;">${stepIndex === ONBOARDING_STEPS.length-1 ? 'Tugatish' : 'Keyingisi'}</button>
            </div>`;
        overlay.appendChild(card);

        document.getElementById('crm-tour-skip').onclick = endTour;
        document.getElementById('crm-tour-next').onclick = () => { stepIndex++; renderStep(); };
        const prevBtn = document.getElementById('crm-tour-prev');
        if (prevBtn) prevBtn.onclick = () => { stepIndex--; renderStep(); };
    }

    function endTour() {
        overlay.remove();
        localStorage.setItem('crm_onboarding_done', '1');
    }

    renderStep();
}

function checkFirstTimeOnboarding() {
    if (localStorage.getItem('crm_onboarding_done') === '1') return;
    if (!window.location.pathname.includes('dashboard.html')) return;
    // Bo'sh CRM bo'lsa (hech qanday talaba/guruh yo'q) — onboarding ko'rsatish ma'noliroq
    setTimeout(() => {
        const banner = document.createElement('div');
        banner.id = 'crm-onboarding-banner';
        banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e1e2d;color:#fff;border-radius:14px;padding:14px 20px;font-size:13px;z-index:9998;box-shadow:0 8px 28px rgba(0,0,0,.25);display:flex;align-items:center;gap:14px;max-width:420px;';
        banner.innerHTML = `
            <i class="ti ti-sparkles" style="font-size:22px;color:#ff7a00;flex-shrink:0;"></i>
            <div style="flex:1;"><div style="font-weight:700;margin-bottom:2px;">CRM bilan tanishasizmi?</div><div style="opacity:.7;font-size:12px;">2 daqiqalik qisqa tur orqali asosiy bo'limlarni ko'rsatamiz</div></div>
            <button id="crm-tour-start-btn" style="background:#ff7a00;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">Boshlash</button>
            <button id="crm-tour-dismiss-btn" style="background:none;border:none;color:#fff;opacity:.5;cursor:pointer;font-size:18px;">×</button>
        `;
        document.body.appendChild(banner);
        document.getElementById('crm-tour-start-btn').onclick = () => { banner.remove(); startOnboardingTour(); };
        document.getElementById('crm-tour-dismiss-btn').onclick = () => { banner.remove(); localStorage.setItem('crm_onboarding_done', '1'); };
    }, 1200);
}

/* ── 17. TALABA ID GENERATSIYASI — TO'QNASHUVSIZ (collision-safe) ──
   MUHIM TUZATISH: avval `Math.floor(1000 + Math.random()*9000)` hech qanday
   takrorlanish tekshiruvisiz ishlatilardi. ~9000 ta mumkin bo'lgan qiymat bilan,
   talabalar soni ortishi (jumladan yangi "guruhga nusxalash" funksiyasi orqali)
   ID TO'QNASHUVI ehtimolini oshiradi — bu esa ikki talabaning to'lov tarixi,
   davomati va baholari ARALASHIB KETISHI kabi jiddiy xatoga olib kelishi mumkin edi.
   Endi yangi ID har doim FAOL + ARXIVLANGAN talabalar ro'yxati bilan solishtirib,
   takrorlanmasligi kafolatlanadi. */
function generateUniqueStudentId() {
    const active = JSON.parse(localStorage.getItem('students') || '[]');
    const archived = JSON.parse(localStorage.getItem('archived_students') || '[]');
    const usedIds = new Set([...active.map(s => s.id), ...archived.map(s => s.id)]);

    let candidate;
    let attempts = 0;
    do {
        candidate = Math.floor(1000 + Math.random() * 9000);
        attempts++;
    } while (usedIds.has(candidate) && attempts < 50);

    // Agar 50 urinishda ham bo'sh ID topilmasa (deyarli imkonsiz, ~9000 talaba bo'lganda) —
    // vaqt tamg'asiga asoslangan kafolatlangan noyob ID'ga o'tamiz
    if (usedIds.has(candidate)) {
        candidate = Date.now() % 1000000;
    }
    return candidate;
}

/* ── 18. GURUH CHEGIRMASI — sana oralig'iga bog'liq hisoblash ──
   Guruhga chegirma: discountType ('percent'|'amount'), discountValue (son),
   discountStart / discountEnd (sana). Joriy sana shu oraliqda bo'lsagina chegirma amal qiladi. */
function isDiscountActive(group) {
    if (!group || !group.discountValue || Number(group.discountValue) <= 0) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    if (group.discountStart) {
        const start = new Date(group.discountStart);
        if (today < start) return false;
    }
    if (group.discountEnd) {
        const end = new Date(group.discountEnd);
        end.setHours(23,59,59,999);
        if (today > end) return false;
    }
    return true;
}

function getEffectiveGroupPrice(group) {
    const basePrice = Number(group && group.price) || 0;
    if (!isDiscountActive(group)) return basePrice;
    let discounted = basePrice;
    if (group.discountType === 'percent') {
        discounted = basePrice - (basePrice * Number(group.discountValue) / 100);
    } else {
        discounted = basePrice - Number(group.discountValue);
    }
    return Math.max(Math.round(discounted), 0);
}

function formatGroupPriceHTML(group) {
    const base = Number(group && group.price) || 0;
    if (!base) return 'Belgilanmagan';
    if (!isDiscountActive(group)) return base.toLocaleString() + ' UZS';
    const effective = getEffectiveGroupPrice(group);
    const label = group.discountType === 'percent' ? `-${group.discountValue}%` : `-${Number(group.discountValue).toLocaleString()} UZS`;
    return `<span style="text-decoration:line-through;color:#99a1ad;font-weight:400;font-size:12px;">${base.toLocaleString()}</span> ${effective.toLocaleString()} UZS <span class="badge bg-danger-lt" style="font-size:10px;">${label}</span>`;
}
