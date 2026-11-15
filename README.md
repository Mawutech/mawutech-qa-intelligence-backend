# Mawutech QA Intelligence — Backend

Phase 1 API foundation: Express REST API, PostgreSQL/Prisma persistence, JWT administrator login and Playwright smoke testing.

## Setup
1. Use Node.js 20+ and Docker. Copy .env.example to .env.
2. Set a long random JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD_HASH. Generate a hash with: npm install && node scripts/hash-password.js 'your-long-password'.
3. Set TEST_ALLOWED_HOSTS to exact domains you own or are authorized to test. Never use a wildcard.
4. Start database: docker compose up -d db. Install: npm install. Generate: npm run db:generate.
5. During initial development run: npx prisma migrate dev --name init. Install browser: npm run browser:install. Start: npm run dev.

## Routes
- GET /api/health
- POST /api/auth/login
- GET/POST /api/projects
- GET /api/projects/:id
- GET/POST /api/projects/:projectId/websites
- GET /api/test-runs
- POST /api/test-runs/:websiteId

Protected routes use Authorization: Bearer <token>.

## Safety and scope
Only assess systems you own or have explicit authorization to test. Exact hostname allowlisting and private-IP literal checks are baseline controls, not complete SSRF protection. Production browser workers must run in isolated network infrastructure with DNS resolution and outbound IP/port controls. This first version has one environment-configured admin; user management, tenancy, queued jobs, screenshots, AI scenarios and security/load testing are later phases. Never expose API secrets to the frontend.