# Mathzone CRM v11.0 - Production Ready (Yangilangan)

Ta'lim markazlari uchun to'liq CRM tizimi - Backend API va Frontend bilan.

## ✨ Yaxshilangan Xususiyatlar

### Backend
- ✅ **Barcha kritik xatolar tuzatildi**
- 🔐 **Xavfsizlik yaxshilandi**: JWT, CORS, Rate Limiting, Bcrypt (12 rounds)
- 📊 **To'liq CRUD API**: Students, Groups, Teachers, Payments, Attendance
- 🎯 **Zod Validation**: Barcha endpoint'larda input validation
- 📝 **Winston Logger**: Structured logging va daily file rotation
- 🛡️ **Error Handling**: Prisma, JWT, Zod error'lar uchun custom handler
- 🔄 **Graceful Shutdown**: Database disconnect va cleanup
- 💾 **Prisma Singleton**: Optimal database connection boshqaruvi

### Frontend
- 🌐 **Backend API Integration**: To'liq integratsiya
- 💾 **Cache Layer**: Offline support uchun
- ✅ **O'zbekiston telefon validation**: 998XX operator kodlari
- 🔄 **Token Refresh**: Avtomatik token yangilanish
- 🛡️ **XSS Protection**: HTML sanitization

## 🚀 Quick Start with Docker

```bash
# Clone repository
git clone <repo-url>
cd mathzone-crm

# Start all services
docker-compose up -d

# Wait for database initialization (~10 seconds)
# Backend will be available at http://localhost:3000
```

Frontend: `frontend/CRM_full/login.html` (Live Server port 5500)

## 📦 Manual Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# IMPORTANT: Update .env with secure values:
# - JWT_SECRET: 64+ character random string
# - JWT_REFRESH_SECRET: Another random string
# - DATABASE_URL: Your PostgreSQL connection

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev

# Seed database with demo users
npm run seed

# Start development server
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. Open `frontend/CRM_full` folder
2. Start with Live Server (VSCode extension) on port 5500
3. Or use any static file server

**Important**: Frontend CORS configured for `http://localhost:5500` and `http://127.0.0.1:5500`

## 👤 Demo Logins

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| reception | 1234 | Reception |
| teacher | 1234 | Teacher |

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mathzone_crm"
JWT_SECRET="your-super-secret-64-character-string-here"
JWT_REFRESH_SECRET="another-secret-string"
PORT=3000
NODE_ENV=development
CORS_ORIGINS="http://localhost:5500,http://127.0.0.1:5500"
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
LOG_DIR=logs
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Students
- `GET /api/students` - Get all students (filters: status, groupId, search)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Payments
- `GET /api/payments` - Get all payments (filters: studentId, startDate, endDate, method)
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment
- `DELETE /api/payments/:id` - Delete payment

### Attendance
- `GET /api/attendance` - Get attendances (filters: studentId, groupId, startDate, endDate)
- `POST /api/attendance` - Create attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Health Check
- `GET /api/health` - Check API and database status

## 🏗️ Project Structure

```
mathzone-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   │   ├── db.ts (Prisma singleton)
│   │   │   ├── logger.ts (Winston)
│   │   │   └── audit.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── CRM_full/
│       ├── apiService.js (API integration)
│       ├── dataService.js (Data layer)
│       ├── auth.js
│       ├── shared.js
│       └── *.html (Pages)
├── docker-compose.yml
└── README.md
```

## 🔒 Security Features

- JWT token authentication (15min access, 7 days refresh)
- Rate limiting (100 req/min global, 5 attempts/15min login)
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection protection (Prisma ORM)
- XSS protection
- Password hashing with bcrypt (12 rounds)
- Audit logging for all operations

## 📊 Database Schema

- **Users**: Admin, Reception, Teacher, Accountant roles
- **Students**: Full student information with status tracking
- **Groups**: Course groups with teacher assignment
- **Teachers**: Teacher profiles and subject information
- **Payments**: Financial transactions with balance tracking
- **Attendance**: Student attendance records
- **Grades**: Student assessment scores
- **Notes**: Reminders and student notes
- **AuditLog**: Complete audit trail

## 🐛 Bug Fixes

Ushbu versiyada 35+ ta xato tuzatildi:
1. authController.ts syntax error
2. Prisma schema AuditLog relation
3. Server graceful shutdown
4. JWT_SECRET validation
5. CORS configuration
6. Rate limiting on login
7. Bcrypt salt rounds
8. Audit log userId nullable
9. Input validation
10. Error handling
... va boshqalar

## 📝 License

MIT License

## 🤝 Contributing

Pull requests are welcome!

## 📞 Support

Issues: GitHub Issues
Email: support@mathzone.uz

---

## 🔧 Troubleshooting

### "Auth is not defined" xatosi

**Muammo**: Login sahifasida "Auth is not defined" xatosi ko'rinmoqda.

**Sabab**: `auth.js` fayli yuklanmagan yoki backend server ishlamayotgan.

**Yechim**:

1. **Backend serverini tekshiring**:
   ```bash
   # Backend ishga tushganmi?
   curl http://localhost:3000/api/health
   
   # Javob bo'lishi kerak:
   # {"status":"healthy",...}
   ```

2. **Backend'ni ishga tushiring**:
   ```bash
   cd mathzone-crm
   docker-compose up -d
   
   # Yoki
   cd backend
   npm install
   npm run dev
   ```

3. **Brauzer konsolini tekshiring** (F12):
   - CORS xatolari bormi?
   - Network xatolari bormi?
   - `auth.js` yuklanganmi?

4. **Frontend'ni to'g'ri ochganmisiz?**
   - ✅ To'g'ri: Live Server (http://localhost:5500)
   - ❌ Noto'g'ri: `file:///path/to/login.html`

5. **CORS muammosi bo'lsa**:
   ```bash
   # Backend .env faylida
   CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
   ```

### Backend ishga tushmayapti

1. **PostgreSQL ishlaganmi?**
   ```bash
   docker-compose ps
   # postgres container "Up" bo'lishi kerak
   ```

2. **Loglarni ko'ring**:
   ```bash
   docker-compose logs backend
   docker-compose logs postgres
   ```

3. **Environment variables to'g'rimi?**
   ```bash
   # .env faylida:
   DATABASE_URL=postgresql://postgres:password@postgres:5432/mathzone_crm
   JWT_SECRET=your-secret-here
   ```

### Frontend Backend'ga ulanmayapti

1. **Backend URL to'g'rimi?**
   - `auth.js` va `apiService.js` da: `http://localhost:3000`

2. **CORS xatosi bo'lsa**:
   - Backend'da `CORS_ORIGINS` environment variable to'g'ri sozlangan bo'lishi kerak
   - Frontend URL backend'da ruxsat etilgan bo'lishi kerak

3. **Network xatosi bo'lsa**:
   - Backend port 3000'da ishlaganmi?
   - Firewall to'siq qilmayaptimi?

### Database Migration xatolari

```bash
# Migrations'ni qayta ishga tushiring
docker-compose exec backend npx prisma migrate reset
docker-compose exec backend npm run seed

# Yoki
cd backend
npx prisma migrate reset
npm run seed
```

### Qo'shimcha yordam

Agar muammo hal bo'lmasa:
1. GitHub'da issue oching
2. Xato xabarini va loglarni yuboring
3. Brauzer konsol chiqishini screenshot qiling
