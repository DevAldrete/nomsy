# Production-Readiness Implementation Plan

## Overview

Address all 10 issues identified for production deployment while keeping Express (updating CLAUDE.md accordingly).

## Priority: Critical

### 1. CI/CD Pipeline

- **File:** `.github/workflows/ci.yml`
- **Jobs:**
  - Lint (ESLint)
  - TypeScript typecheck
  - Test (bun test for api, appropriate for web)
  - Build verification
- **Triggers:** Push to main, PRs

### 2. Pre-commit/Pre-deployment Verification

- Add husky pre-commit hooks
- Add lint-staged for staged files
- Script: `bun run lint && bun run typecheck && bun run test`

### 3. Tech Stack Documentation

- **File:** `apps/api/CLAUDE.md` — Update to explicitly specify Express (not Bun.serve)
- **File:** `README.md` — Update architecture section to specify Express

## Priority: Security & Reliability

### 4. Input Validation with Zod

- Install `zod` package
- Add validation middleware for API endpoints
- Schema files in `apps/api/src/lib/validations/` or inline with routes

### 5. Rate Limiting

- Install `express-rate-limit`
- Configure global rate limit (e.g., 100 req/15min per IP)
- Add to main app middleware

### 6. Security Headers (Helmet)

- Install `helmet`
- Add to Express app middleware
- Configure CSP, HSTS, X-Frame-Options, etc.

### 7. Health Check Endpoint

- **Route:** `GET /health`
- Response: `{ status: "ok", timestamp: "...", version: "..." }`
- Include dependency health (DB, Redis if applicable)

## Priority: Operational

### 8. Dockerfile

- **File:** `Dockerfile` (root) or `apps/api/Dockerfile`
- Multi-stage: build stage, production stage
- Use appropriate base image (Node.js 20 LTS or Bun if preferred)
- Expose port, set NODE_ENV=production

### 9. Documentation

- **File:** `README.md` — Complete "Getting Started" section
- Add deployment instructions
- Add environment variables documentation

### 10. Test Coverage

- Review existing tests in `apps/api/`
- Add tests for: auth routes, recipe routes, validation, health endpoint
- Target: 70%+ coverage minimum

## Implementation Order

1. Update CLAUDE.md and README.md (clarifies tech stack)
2. Add Dockerfile (foundation for deployment testing)
3. Add GitHub Actions workflow (CI foundation)
4. Add security middleware (helmet, rate-limit, health)
5. Add Zod validation to key endpoints
6. Expand test coverage
7. Verify full pipeline works
8. Final documentation pass
