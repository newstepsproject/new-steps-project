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
| L1-3 | L1 | Donations & requests API contracts | P0 | Local | Auto | Node scripts |
| L2-1 | L2 | Visitor browse/filter shoes & add to cart | P0 | Local | Auto | Playwright workflow |
| L2-2 | L2 | New user signup + verify + login | P0 | Local | Auto | Playwright workflow |
| L2-3 | L2 | Authenticated shoe donation submission | P0 | Local | Auto | Playwright workflow |
| L2-4 | L2 | Authenticated money donation submission | P0 | Local | Auto | Playwright workflow |
| L2-5 | L2 | Request shoes → cart checkout (shipping) | P0 | Local | Auto | Playwright workflow |
| L2-6 | L2 | Admin donation triage (status + email) | P0 | Local | Auto | Playwright workflow |
| L2-7 | L2 | Admin request fulfillment & inventory update | P0 | Local | Auto | Playwright workflow |
| L2-8 | L2 | Admin add/edit shoe inventory item | P0 | Local | Auto | Playwright workflow |
| L2-9 | L2 | Admin manual record entry (offline shoe/money donation, request) | P0 | Local | Auto | Playwright workflow |
| L2-10 | L2 | Admin analytics dashboard loads metrics/cards | P1 | Local | Auto | Playwright workflow |
| L2-11 | L2 | Admin volunteers/contact queue actions | P1 | Local | Auto | Playwright workflow |
| L2-12 | L2 | Admin settings update (shipping fee, request limit) | P0 | Local | Auto | Playwright + API assertions |
| L3-1 | L3 | Responsive home page (360/768/1280) | P1 | Local | Semi | Playwright headed |
| L3-2 | L3 | Accessibility sweep (Home, Shoes, Account, Admin dashboard) | P1 | Local | Semi | Playwright + axe |
| L3-3 | L3 | Account verification banner regression | P0 | Local | Auto | `npx playwright test testing/run-verify-banner.spec.ts` |
| L3-4 | L3 | Donation confirmation + account history sync | P0 | Local | Auto | `npx playwright test testing/run-donation-visibility.spec.ts` |
| L3-5 | L3 | Admin donation search by reference ID | P0 | Local | Auto | `npx playwright test testing/run-admin-search.spec.ts` |
| L3-6 | L3 | Get Involved / Volunteer / Contact forms | P0 | Local | Auto | Playwright API + Gmail inbox check |
| L3-7 | L3 | Admin orders page (shipping labels, notes) | P1 | Local | Auto | Playwright workflow |
| L4-1 | L4 | Parallel user/admin processing (race conditions) | P0 | Local | Manual/Hybrid | Dual-browser scripted run |
| L4-2 | L4 | Donation → inventory → fulfillment loop | P0 | Local | Manual/Hybrid | Scripted checklist + DB assertions |
| L4-3 | L4 | Get Involved submissions reach admin inbox | P0 | Local | Manual/Hybrid | Playwright + Gmail inbox |
| L4-4 | L4 | Email delivery verification (Gmail app password) | P1 | Local | Manual | Gmail inbox |
| L4-5 | L4 | Concurrent admin edits on same record | P1 | Local | Manual | Dual browser sessions |
| L5-1 | L5 | Production smoke | P0 | Prod | Auto | `npm run smoke` |
| L1-4 | L1 | Data schema parity audit | P0 | Local/Prod | Manual | `testing/cases/release-data-integrity.md` §1 |
| L2-13 | L2 | Donation → inventory data parity | P0 | Local | Semi | Playwright + `mongosh` (see release-data-integrity §2–3) |
| L3-8 | L3 | Admin/public data parity sweep | P0 | Local | Manual/Hybrid | Checklist in `testing/cases/release-data-integrity.md` |

## 3. Detailed Test Cases

### L2-1 – Visitor Browse / Filter / Cart Prep
- **Preconditions**: At least 3 published shoes across multiple sports.
- **Steps**:
  1. Navigate as anonymous visitor to `/shoes`.
  2. Exercise sport, size, and condition filters; ensure card counts update.
  3. Open detail page, add item to cart; confirm mini-cart badge increments.
  4. Attempt checkout; verify login/signup wall appears.
- **Expected**: Filters behave, cart persists through navigation, checkout flow forces auth.

### L2-2 – New User Signup + Verify + Login
- **Preconditions**: Gmail app password configured; verification emails accessible via inbox.
- **Steps**:
  1. Submit register form with unique email (`newsteps.dev+<timestamp>@gmail.com`).
  2. Capture verification email via Gmail API helper.
  3. Hit verification link; expect success message.
  4. Login with same credentials; expect redirect to `/account`.
  5. Assert `session.user.emailVerified === true` (API call).
- **Expected Result**: Account page shows verified banner removed.

### L2-3 – Authenticated Shoe Donation Submission
- **Steps**:
  1. Login as baseline account (`newsteps.dev@gmail.com`).
  2. Complete donation form with sport/condition metadata.
  3. Assert 201 response, presence of donation ID in confirmation card.
  4. Reload account → donations tab; verify new record with status `submitted`.
- **Expected**: Donation persisted, visible to user, ready for admin triage.

### L2-4 – Authenticated Money Donation Submission
- **Steps**:
  1. Login as authenticated user.
  2. Submit money donation form with Stripe offline mode.
  3. Validate API response and confirmation email recorded.
- **Expected**: Donation record created, confirmation email queued.

### L2-5 – Request Shoes → Cart Checkout (Shipping)
- **Steps**:
  1. Visitor browses shoes, adds item to cart.
  2. Registers/logs in when prompted.
  3. Completes shipping form, submits request.
  4. Confirms request visible in account tab and admin dashboard.
- **Expected**: Request record created, cart cleared, confirmation email sent.

### L2-6 – Admin Donation Triage (Status + Email)
- **Steps**:
  1. Login as admin via API; open `/admin/shoe-donations`.
  2. Locate donation created in L2-3 by reference ID; open details dialog.
  3. Transition status `submitted → confirmed`, add internal note, trigger email.
  4. Assert API response, DB status history, and user receives notification.
- **Expected**: Donation status updated, `statusHistory` appended, email delivered.

### L2-7 – Admin Request Fulfillment & Inventory Update
- **Steps**:
  1. Login as admin via Playwright API.
  2. Locate pending request created during L2-5.
  3. Transition status through `submitted → confirmed → fulfilled`.
  4. Assign shipment tracking, decrement linked shoe inventory, verify user request tab.
- **Expected**: Status history updated, `Shoe` model count adjusts, email logged.

### L2-8 – Admin Add/Edit Shoe Inventory Item
- **Steps**:
  1. From dashboard quick action, open `/admin/shoes/add`.
  2. Create new shoe, linking to existing donation when applicable.
  3. Edit same shoe (`/admin/shoes/edit/[id]`) to adjust size/status.
  4. Check `/shoes/[id]` catalog entry to confirm availability.
- **Expected**: Inventory record persisted, update reflected on public catalog.

### L2-9 – Admin Manual Record Entry (Offline)
- **Steps**:
  1. Use `+` action on shoe donations/money donations/requests pages.
  2. Submit offline record with `isOffline=true` markers.
  3. Validate new entry flagged as offline and accessible in user account if email matches.
- **Expected**: Offline records saved, clearly labeled, email notifications optional.

### L2-10 – Admin Analytics Dashboard Loads Metrics
- **Steps**:
  1. Hit `/admin` dashboard.
  2. Confirm summary cards render counts derived from DB fixtures.
  3. Validate quick actions navigate correctly and system status timestamp updates.
- **Expected**: Metrics non-zero, navigation functioning, no console errors.

### L2-11 – Admin Volunteers / Contact Queue Actions
- **Steps**:
  1. Navigate to `/admin/volunteers`.
  2. Approve, reject, archive sample volunteer entries (seed data or API-generated).
  3. Ensure status badges update and actions logged (toast + DB when implemented).
- **Expected**: Actions mutate records, appear in UI, trigger email if configured.

### L2-12 – Admin Settings Update
- **Steps**:
  1. Open `/admin/settings`; change shipping fee and max shoes per request.
  2. Save; assert confirmation toast.
  3. Query `/api/settings` to ensure new values persisted.
  4. Re-run cart checkout to confirm limits enforced.
- **Expected**: Settings saved to DB, immediate impact on user flows.

### L3-7 – Admin Orders Page (Shipping Labels & Notes)
- **Steps**:
  1. Visit `/admin/orders`; ensure pending orders from L2-5 appear.
  2. Add tracking number, mark shipping carrier, upload label if supported.
  3. Update fulfillment note and verify status badge updates.
  4. Confirm user account registers the shipment details.
- **Expected**: Orders table reflects updates, request status timeline syncs, user notification triggered.

### L4-1 – Parallel Processing
- **Steps**:
  1. User A submits shoe request.
  2. Admin logs in simultaneously and approves donation.
  3. Validate no race conditions (requests remain assigned correctly).

### L4-2 – Donation → Inventory → Fulfillment Loop
- **Steps**:
  1. User submits donation (L2-3).
  2. Admin converts donation to inventory (L2-8) and assigns to pending request.
  3. User receives fulfillment email and sees request marked fulfilled.
- **Expected**: Complete end-to-end audit trail across donation, inventory, request.

## 4. Data Integrity Release Audit
- Use `testing/cases/release-data-integrity.md` before every release for schema → app → admin parity.
- Critical gap to track: orders are not generated by `/api/requests`; block release until resolved (see plan §5.1).
- Donation pickup preference fields exist in schema but are not captured; plan §5.2 documents remediation.
- Capture mongosh samples and admin screenshots in `testing/reports/<release>-*.md` as evidence.

### L4-3 – Get Involved to Admin Inbox
- **Steps**:
  1. Visitor submits volunteer, partner, and contact forms.
  2. Poll Gmail app inbox for notifications; verify admin `volunteers`/`partners` view reflects entry.
- **Expected**: Emails delivered, admin queue populated.

### L4-4 – Email Delivery Verification
- **Steps**:
  1. Trigger each transactional email (registration, donation, request status changes).
  2. Confirm delivery via Gmail API; validate subjects/body content and links.
- **Expected**: All critical emails delivered within acceptable latency, content matches templates.

### L4-5 – Concurrent Admin Edits
- **Steps**:
  1. Open same donation/request record in two admin sessions.
  2. Apply conflicting updates (notes/status) nearly simultaneously.
  3. Confirm last-write-wins is acceptable or report concurrency issue.
- **Expected**: No data corruption; UI surfaces latest state with clear history.

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
