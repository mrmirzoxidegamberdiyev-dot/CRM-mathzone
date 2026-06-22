# Changelog - Mathzone CRM

## [11.0.0] - 2026-06-22 - MAJOR BUGFIX & SECURITY UPDATE

### 🚨 Critical Fixes (3)
1. **Backend Syntax Error** - Fixed extra `}` in `authController.ts` line 84
2. **Prisma Schema Error** - Added missing `auditLogs` relation to `User` model
3. **Server Graceful Shutdown** - Added proper Prisma disconnect on SIGTERM/SIGINT

### 🔐 Security Improvements (10)
4. **JWT_SECRET Validation** - Added environment validation on startup
5. **CORS Configuration** - Made CORS origins configurable via environment
6. **Login Rate Limiting** - Added `loginLimiter` to `/api/auth/login` (5 attempts/15min)
7. **Bcrypt Salt Rounds** - Increased from 10 to 12 (configurable)
8. **Password Rehashing** - Auto-rehash passwords with weak salt on login
9. **Audit Log Fix** - Fixed userId nullable issue causing runtime errors
10. **Input Validation** - Added Zod validation to all API endpoints
11. **Error Handling** - Prevent internal error details exposure in production
12. **Token Refresh Loop** - Fixed infinite loop in frontend token refresh
13. **XSS Protection** - Added HTML sanitization in frontend

### 📊 New Features (15)
14. **Groups API** - Full CRUD for course groups
15. **Teachers API** - Full CRUD for teachers
16. **Payments API** - Full CRUD with automatic balance updates
17. **Attendance API** - Full CRUD for attendance tracking
18. **Prisma Singleton** - Proper database connection management
19. **Winston Logger** - Structured logging with daily file rotation
20. **Error Handler Middleware** - Unified error handling (Zod, Prisma, JWT)
21. **Request Logging** - HTTP request/response logging with duration
22. **Health Check** - Enhanced health endpoint with DB status, uptime, memory
23. **Student Filters** - Added search, status, groupId filters
24. **Payment Filters** - Added date range, method, student filters
25. **Attendance Filters** - Added date range, student, group filters
26. **Cache Layer** - Frontend offline support with localStorage cache
27. **Phone Validation** - Uzbekistan phone number validation (998XX codes)
28. **API Documentation** - Complete API endpoints in README

### 🏗️ Architecture Improvements (7)
29. **Database Singleton** - Centralized Prisma client in `utils/db.ts`
30. **Validation Layer** - Zod schemas for all entities
31. **Audit Logging** - Complete audit trail for all operations
32. **Frontend-Backend Integration** - Replaced localStorage with API calls
33. **Error Boundaries** - Proper error handling in frontend
34. **TypeScript Strict** - Better type safety
35. **Code Organization** - Separated concerns (controllers, routes, utils)

### 🐳 Docker & DevOps (8)
36. **Docker Compose** - Added healthchecks, networks, restart policies
37. **Production Compose** - Separate `docker-compose.prod.yml`
38. **Multi-stage Build** - Optimized production Dockerfile
39. **Environment Variables** - Centralized `.env.example`
40. **Makefile** - Easy commands (dev, prod, backup, logs)
41. **Docker Entrypoint** - Auto-migration and seeding
42. **Health Checks** - Container health monitoring
43. **Non-root User** - Security best practice in production

### 📝 Documentation (3)
44. **README Update** - Complete setup, API, security docs
45. **API Endpoints** - Full REST API documentation
46. **Environment Guide** - Configuration examples

### 🛠️ Developer Experience (2)
47. **.gitignore** - Proper ignore patterns
48. **.dockerignore** - Optimized Docker builds

---

## Summary

**Total Issues Fixed**: 35+ bugs and improvements
- **Critical Bugs**: 3
- **Security Issues**: 10
- **New Features**: 15
- **Architecture**: 7
- **Docker/DevOps**: 8

**Breaking Changes**: 
- Frontend now requires Backend API (no longer works with localStorage only)
- Environment variables required for production deployment
- Database migrations needed

**Upgrade Guide**:
```bash
# 1. Pull latest code
git pull

# 2. Update environment
cp .env.example .env
# Edit .env with your configuration

# 3. Run migrations
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy

# 4. Restart services
docker-compose restart
```

---

## [10.0.0] - Previous Version
- Initial localStorage-based implementation
- Basic CRUD operations
- Demo authentication
