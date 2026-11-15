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
- POST /api/auth/login\n- POST /api/ai/scenarios (AI-assisted browser-executable scenario generation)\n- GET /api/projects/:projectId/scenarios\n- POST /api/projects/:projectId/scenarios\n- PATCH /api/projects/:projectId/scenarios/:scenarioId/status\n- POST /api/test-runs/scenarios/:scenarioId (approved scenario execution; body: websiteId)
- GET/POST /api/projects
- GET /api/projects/:id
- GET/POST /api/projects/:projectId/websites
- GET /api/test-runs
- POST /api/test-runs/:websiteId

Protected routes use Authorization: Bearer <token>.

## Safety and scope
Only assess systems you own or have explicit authorization to test. Exact hostname allowlisting, DNS address checks, and request-level destination checks are defense-in-depth controls, not complete SSRF protection. DNS rebinding and network changes can still create risk. Production browser workers must run in isolated network infrastructure with enforced outbound IP/port controls and private/link-local/metadata ranges blocked at the network layer. This first version has one environment-configured admin; user management, tenancy, queued jobs, screenshots, AI scenarios and security/load testing are later phases. Never expose API secrets to the frontend. AI scenario generation uses the OpenAI Responses API; configure OPENAI_API_KEY on the backend only. OPENAI_MODEL defaults to gpt-6-luna and can be changed per deployment. The endpoint is rate-limited and validates the generated JSON before returning it. AI-generated scenarios are drafts and must be reviewed and explicitly approved before execution. The runner accepts a constrained action allowlist (navigation restricted to same-site relative paths, accessible locators, form interactions and assertions); arbitrary JavaScript is not supported. Browser workers still require isolated outbound network controls before production deployment.