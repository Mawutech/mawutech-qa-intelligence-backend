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
- POST /api/ai/scenarios (AI-assisted browser-executable scenario generation)
- GET /api/projects/:projectId/scenarios
- POST /api/projects/:projectId/scenarios
- PATCH /api/projects/:projectId/scenarios/:scenarioId/status
- POST /api/test-runs/scenarios/:scenarioId (approved scenario execution; body: websiteId)
- GET/POST /api/projects
- GET /api/projects/:id
- GET/POST /api/projects/:projectId/websites
- GET /api/test-runs
- POST /api/test-runs/:websiteId

Protected routes use Authorization: Bearer <token>.

## Safety and scope
Only assess systems you own or have explicit authorization to test. Exact hostname allowlisting, DNS address checks, and request-level destination checks are defense-in-depth controls, not complete SSRF protection. DNS rebinding and network changes can still create risk. Production browser workers must run in isolated network infrastructure with enforced outbound IP/port controls and private/link-local/metadata ranges blocked at the network layer. This first version has one environment-configured admin; multi-user management, tenancy, queued jobs and advanced security/load testing remain future phases. Never expose API secrets to the frontend. AI scenario generation uses the OpenAI Responses API; configure OPENAI_API_KEY on the backend only. OPENAI_MODEL defaults to gpt-6-luna and can be changed per deployment. The endpoint is rate-limited and validates the generated JSON before returning it. AI-generated scenarios are drafts and must be reviewed and explicitly approved before execution. The runner accepts a constrained action allowlist (navigation restricted to same-site relative paths, accessible locators, form interactions and assertions); arbitrary JavaScript is not supported. Browser workers still require isolated outbound network controls before production deployment.

### Screenshot evidence

Browser smoke tests and approved scenario runs attempt to capture a full-page PNG screenshot. When Cloudinary credentials are configured, the image is uploaded to the configured evidence folder and the secure URL is stored with the test run. If Cloudinary is not configured or upload fails, the test result is still saved without a screenshot URL.

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only in the backend deployment environment. Never expose these values in the frontend or commit real secrets.


## Production deployment (Docker)

The repository includes a Playwright-compatible Docker image. Deploy it as a Docker web service on a host that supports the Playwright Ubuntu image and persistent external PostgreSQL.

1. Create a managed PostgreSQL database and copy its **internal connection string** into the backend service as `DATABASE_URL`.
2. Build the backend from this repository using its `Dockerfile`. The container installs dependencies, generates Prisma Client, applies committed migrations, and starts the API.
3. Set `NODE_ENV=production`, `PORT=4000`, `JWT_SECRET` (at least 32 random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `FRONTEND_ORIGIN`, and `TEST_ALLOWED_HOSTS`.
4. Set `OPENAI_API_KEY` to enable scenario generation. `OPENAI_MODEL` defaults to `gpt-6-luna`.
5. Set the three Cloudinary credentials to enable screenshot evidence uploads. These are optional.
6. Configure the platform health check to `/api/health`. Allow outbound HTTPS only as required; browser workers need strict egress controls to block private, loopback, link-local and cloud metadata addresses.
7. After deployment, verify `GET /api/health`, sign in, create a project, register an authorized staging website, and run a smoke test.

Never put secrets in the frontend, Git repository, build arguments, or client-side environment variables. Keep `FRONTEND_ORIGIN` limited to the exact deployed frontend origin(s). Do not run tests against production data without explicit authorization.
