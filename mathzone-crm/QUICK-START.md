# 🚀 Mathzone CRM - Tezkor Boshlash

## 1️⃣ Backend'ni ishga tushirish (5 daqiqa)

### Docker bilan (Tavsiya qilinadi)

```bash
# Repository'ni clone qiling
git clone https://github.com/mrmirzoxidegamberdiyev-dot/CRM-mathzone.git
cd CRM-mathzone/mathzone-crm

# Docker compose bilan ishga tushiring
docker-compose up -d

# 30 sekund kuting...
```

### Node.js bilan (Manual)

```bash
cd mathzone-crm/backend

# Dependencies'ni o'rnating
npm install

# .env fayl yarating
cp .env.example .env

# MUHIM: .env faylida quyidagilarni o'zgartiring:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/mathzone_crm
# JWT_SECRET=your-secret-key-here

# Database'ni sozlang
npx prisma migrate dev
npm run seed

# Serverni ishga tushiring
npm run dev
```

---

## 2️⃣ Backend ishlaganini tekshiring

```bash
# Health check
curl http://localhost:3000/api/health

# Javob (success):
{
  "status": "healthy",
  "database": { "status": "connected" }
}
```

Agar xato bo'lsa:
- PostgreSQL ishlaganini tekshiring
- `.env` faylini tekshiring
- `docker-compose logs backend` ni ko'ring

---

## 3️⃣ Frontend'ni oching

### VSCode Live Server bilan (Tavsiya)

1. **VSCode'ni oching**
2. **`mathzone-crm/frontend/CRM_full/login.html`** faylini oching
3. **Live Server**'ni bosing (yoki F1 → "Live Server: Open with Live Server")
4. Brauzer ochiladi: `http://localhost:5500/login.html`

### Boshqa usul (Python)

```bash
cd mathzone-crm/frontend/CRM_full
python3 -m http.server 5500

# Brauzer: http://localhost:5500/login.html
```

---

## 4️⃣ Login qiling

**Demo credentials**:
- **admin** / **admin123** → Administrator
- **reception** / **1234** → Reception  
- **teacher** / **1234** → Teacher

---

## ⚠️ Xatolar va Yechimlar

### "Auth is not defined"

✅ **Yechim**:
1. Backend ishlaganini tekshiring:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Agar xato bo'lsa, backend'ni ishga tushiring:
   ```bash
   docker-compose up -d
   # yoki
   cd backend && npm run dev
   ```

3. Brauzer konsolini tekshiring (F12):
   - Network tab → XHR → Login request ko'ringsizmi?
   - Qizil xatolar bormi?

---

### CORS xatosi

✅ **Yechim**:

Backend `.env` faylida:
```env
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Keyin backend'ni restart qiling:
```bash
docker-compose restart backend
```

---

### "Cannot connect to database"

✅ **Yechim**:

```bash
# PostgreSQL ishlaganini tekshiring
docker-compose ps

# Agar postgres yo'q bo'lsa:
docker-compose up -d postgres

# Migration'larni qayta ishga tushiring
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

---

### Port 3000 band

✅ **Yechim**:

```bash
# Port'ni o'zgartiring
# .env faylida:
BACKEND_PORT=3001

# docker-compose.yml'da:
ports:
  - "3001:3000"

# Frontend auth.js'da:
const AUTH_API_BASE = 'http://localhost:3001/api';
```

---

## 🎯 Backend API Test

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc...",
#   "user": { "id": 1, "name": "Behruz Berdiyev", "role": "ADMINISTRATOR" }
# }

# 2. Get students (replace TOKEN with accessToken from above)
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📁 Fayl Tuzilishi

```
mathzone-crm/
├── backend/
│   ├── src/
│   │   ├── server.ts       ← Backend entry point
│   │   ├── controllers/    ← API logic
│   │   ├── routes/         ← API endpoints
│   │   └── middleware/     ← Auth, validation
│   ├── prisma/
│   │   └── schema.prisma   ← Database schema
│   ├── .env                ← Environment variables (yarating!)
│   └── package.json
│
└── frontend/
    └── CRM_full/
        ├── login.html      ← Login page (boshlang'ich sahifa)
        ├── dashboard.html  ← Dashboard
        ├── auth.js         ← Auth module
        └── apiService.js   ← API calls
```

---

## 🔄 Common Commands

```bash
# Backend'ni restart qilish
docker-compose restart backend

# Loglarni ko'rish
docker-compose logs -f backend

# Database'ni reset qilish
docker-compose exec backend npx prisma migrate reset

# Seed data
docker-compose exec backend npm run seed

# Backend'ni to'xtatish
docker-compose down

# Hamma narsani o'chirish (database bilan)
docker-compose down -v
```

---

## 🎉 Tayyor!

Agar hammasi ishlasa:
- Frontend: http://localhost:5500/login.html
- Backend: http://localhost:3000
- Health: http://localhost:3000/api/health

**Savollar?** README.md va TROUBLESHOOTING.md'ni o'qing!
