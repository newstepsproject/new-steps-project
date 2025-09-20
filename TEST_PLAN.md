# New Steps Project – Test Plan & Cases

_Last updated: $(date +"%Y-%m-%d")_

## 1. Scope
Covers visitor, authenticated user, and admin workflows, plus supporting APIs and background jobs on localhost and production.

## 2. Test Execution Matrix

| ID | Layer | Scenario | Priority | Target Env | Automation | Tool |
|----|-------|----------|----------|------------|------------|------|
| L0-1 | L0 | TypeScript compile | P0 | Localhost/CI | Auto | `npm run build` |
| L0-2 | L0 | ESLint | P0 | Localhost/CI | Auto | `npm run lint` |
| L1-1 | L1 | Health & settings APIs | P0 | Local, Prod | Auto | `npm run test:api -- --suite=health` |
| L1-2 | L1 | Auth endpoints (login, register, signout) | P0 | Local | Auto | Playwright API |
| L1-3 | L1 | Donations API schema | P1 | Local | Auto | Node script |
| L2-1 | L2 | Visitor browse shoes | P0 | Local | Auto | Playwright workflow |
| L2-2 | L2 | New user signup + verify + login | P0 | Local | Auto | Playwright workflow |
| L2-3 | L2 | Authenticated donation submission | P1 | Local | Auto | Playwright workflow |
| L2-4 | L2 | Request shoes flow | P1 | Local | Auto | Playwright workflow |
| L2-5 | L2 | Admin login + approve donation | P0 | Local | Auto | Playwright workflow |
| L3-1 | L3 | Responsive home page (360/768/1280) | P1 | Local | Semi | Playwright headed |
| L3-2 | L3 | Accessibility sweep (Home, Shoes, Account, Admin dashboard) | P1 | Local | Semi | Playwright + axe |
| L4-1 | L4 | Parallel user & admin processing | P1 | Local | Manual | Checklist |
| L4-2 | L4 | Email delivery verification (Gmail app password) | P1 | Local | Manual | Gmail inbox |
| L5-1 | L5 | Production smoke | P0 | Prod | Auto | `npm run smoke` |

## 3. Detailed Test Cases

### L2-2 – New User Signup + Verify + Login
- **Preconditions**: Gmail app password configured; verification emails accessible via inbox.
- **Steps**:
  1. Submit register form with unique email (`newsteps.dev+<timestamp>@gmail.com`).
  2. Capture verification email via Gmail API helper.
  3. Hit verification link; expect success message.
  4. Login with same credentials; expect redirect to `/account`.
  5. Assert `session.user.emailVerified === true` (API call).
- **Expected Result**: Account page shows verified banner removed.

### L2-5 – Admin Login + Approve Donation
- **Steps**:
  1. Login as admin via Playwright API.
  2. Create test donation (if none) via API.
  3. Visit `/admin/shoe-donations`, locate donation, mark status `confirmed`.
  4. Verify status change via API.
- **Expected**: Donation transitions to confirmed, history updated.

### L4-1 – Parallel Processing
- **Steps**:
  1. User A submits shoe request.
  2. Admin logs in simultaneously and approves donation.
  3. Validate no race conditions (requests remain assigned correctly).

*(See `testing/cases/*.md` for full list)*

## 4. Entry & Exit Criteria
- **Entry**: Feature complete, migrations applied, test data seeded.
- **Exit**: All P0/P1 cases pass; known issues logged with mitigations; production smoke clean.

## 5. Schedule
| Phase | Duration | Owner |
|-------|----------|-------|
| Documentation refresh | Day 1 | QA |
| Automation run | Day 1 | QA |
| Manual exploratory | Day 2 | QA + Product |
| Fix & regression | Day 2 | Dev |

## 6. Reporting
- Automated runs output JSON under `testing/reports/latest/`.
- Manual runs recorded in `testing/reports/<date>-manual.md`.
- Failures create GitHub issues referencing test ID.

---
