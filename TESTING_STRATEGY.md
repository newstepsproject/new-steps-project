# New Steps Project – Quality Assurance Strategy

_Last updated: $(date +"%Y-%m-%d")_

## 1. Quality Objectives
- Guarantee that every public visitor, authenticated user, and admin can complete their critical workflows without regressions.
- Catch defects as early as possible through layered automated checks and targeted manual exercises.
- Maintain data integrity across donations, requests, inventory, and settings domains.
- Provide fast feedback to developers while still enabling deep exploratory validation before releases.

## 2. Test Architecture Overview

| Layer | Purpose | Scope | Ownership | Automation Level |
|-------|---------|-------|-----------|------------------|
| **L0 – Static Analysis** | Prevent obvious defects before runtime | TypeScript compilation, ESLint, format checks | CI | Automated |
| **L1 – API Contract Validation** | Ensure backend endpoints, DB models, and auth flows behave as expected | REST/Next API routes, Mongo models, mailers | QA / Dev | Automated (Node scripts) |
| **L2 – Workflow Simulation** | Validate core user journeys without browser flakiness | Registration, login, donation, request, cart/checkout, email verification, admin CRUD | QA | Automated (Playwright API & headless) |
| **L3 – Guided UI Regression** | Confirm UI/UX, responsive layouts, and accessibility | Top 15 screens across visitor/user/admin | QA + Product | Semi-automated (Playwright UI) |
| **L4 – Exploratory & Multi-user** | Exercise concurrency, email loops, moderation flows | Parallel users, admin fulfillment, visitor↔admin↔user interactions, fulfillment/inventory loops | QA / Volunteers | Manual scripts & checklists |
| **L5 – Production Smoke** | Validate release | Key endpoints & health, CDN assets | DevOps | Automated (CURL & PM2 checks) |

## 3. Environments & Data
- **Localhost**: `.env.local`, seed data via admin tooling, Gmail app password for transactional tests.
- **Staging/Production**: Managed via PM2 on EC2 (`/var/www/newsteps`). Use admin account `admin@newsteps.fit` and standard user `newsteps.dev@gmail.com`.
- **Test Data Guidelines**:
  - Use descriptive test donations/requests; clean up via admin UI after verification.
  - Use disposable email aliases for registration flows (`+timestamp`).

## 4. Tooling
- **Node/TypeScript Scripts**: Located under `tools/testing/` (new) for API contract checks.
- **Playwright**: APIRequestContext for workflow simulation; headed mode for UI regression (recorded videos, cart flows, multi-tab admin/user sessions).
- **Accessibility**: `axe-playwright` integration for key pages.
- **Performance**: `lighthouse-ci` for home, shoes, account, admin dashboard.
- **Reporting**: Markdown summaries committed to repo under `testing/reports/`.

## 5. Release Gates
A release may proceed only when the following pass on the target environment:
1. `npm run lint` and `npm run build`
2. `npm run test:api` (L1)
3. `npm run test:workflows` (L2)
4. Manual checklist (L3–L4) signed off in `testing/reports/<release>.md`
5. Production smoke script (`npm run smoke -- --target=https://newsteps.fit`)

## 6. Scenario Coverage & Risk Matrix

### 6.1 Coverage Domains
- **Visitor Journeys**: anonymous browsing, shoe filtering, cart interactions, request initiation, get-involved forms, contact submissions.
- **Authenticated User Journeys**: registration & verification, profile updates, donation submissions (shoe & money), cart checkout, shoe requests, account dashboards.
- **Admin Journeys**: dashboard access, donation/request triage, status transitions (submitted→confirmed→fulfilled), inventory adjustments, email notifications, manual record entry.
- **Cross-Role Interactions**: user submits request/donation → admin action → user notification/update; cart checkout flows requiring admin fulfillment.
- **Data & Notification Integrity**: MongoDB assertions, email queue/delivery inspection, PM2 logs.

| Area | Risk | Likelihood | Impact | Mitigation |
|------|------|------------|--------|------------|
| Auth state | Token/cache inconsistency | Medium | High | L1 login checks + L2 session refresh assertions |
| Donations | Missing required fields from donors | Medium | Medium | API schema validation + L2/L3 scenario coverage |
| Requests & Cart | Cart/request data corrupt or mismatched | Medium | High | L2 checkout simulation + L4 multi-user verification |
| Inventory | Wrong status transitions | Medium | High | L2 admin workflows + DB assertions |
| Emails | SMTP failure or incorrect templates | Medium | High | L2 email verification, L4 manual Gmail inbox validation |
| Forms | Get-involved/volunteer forms drop data | Medium | Medium | L2 API checks + L3 UI submissions |
| Mobile UI | Broken responsive layouts | Medium | Medium | Playwright viewport matrix (360px, 768px, 1280px) |
| Admin security | Unauthorized access | Medium | High | L1 authz checks + manual attempt w/out token |

## 7. Maintenance
- Review strategy quarterly or after major feature expansion.
- Update Playwright selectors when UI refactors land.
- Archive prior reports under `testing/archive/`.

---

For detailed test cases and execution steps, see `TEST_PLAN.md`.
