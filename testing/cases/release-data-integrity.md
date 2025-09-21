# Release Data Integrity Plan – Localhost Pass

## Objective
Validate that the database schema, public application flows, and admin tooling stay in sync before the release cut. This checklist expands the existing layered test strategy with explicit data parity checks and gap remediation actions.

## Environment & Accounts
- Load `.env.local` for localhost, ensure `MONGODB_URI` points to a sandbox database (not production).
- Seed baseline data with `npm run dev` and existing admin tooling, or by running `npx ts-node --transpile-only src/scripts/seed-test-data.ts` if fresh fixtures are required.
- Test identities:
  - Admin: `admin@newsteps.fit` / `Admin123!`
  - Standard user: `newsteps.dev@gmail.com` / `TestPass123!`
- Start app locally (`npm run dev`) and keep mongod logs handy via Compass or `mongosh`.

## 1. Database & Schema Audit
### 1.1 Collection ↔ Surface Map
| Collection | Key Data | Public Surfaces | Admin Surfaces | Gap / Risk | Test Hooks |
|------------|----------|-----------------|----------------|------------|------------|
| `users` | name, email, address, sports, role, emailVerified | `/register`, `/account`, `/checkout` | `/admin/users` profile editor | Ensure profile update API persists address + sports values and admin sees same snapshot. | `npm run test:api` (login/profile) + Section 2.A manual API diff |
| `donations` | donorInfo, numberOfShoes, status, statusHistory, isBayArea, notes | `/donate/shoes` form, `/account` donations tab | `/admin/shoe-donations` list + dialog | `pickupPreference`, `pickupDate`, `processingDate` never surfaced; Bay Area logic stored only in notes. Need plan below. | `npx playwright test testing/run-donation-visibility.spec.ts` + Section 1.2(b) mongosh checks |
| `moneydonations` | donor info, amount, status, receiptSent, checkNumber | `/donate/money`, `/account` | `/admin/money-donations` dialog | Verify offline check numbers persist and receiptSent toggles when status → processed. | `npx playwright test testing/admin-manual-entry.spec.ts` (extend) + Section 3.B |
| `shoes` | shoeId, inventoryCount, donorFirst/Last/Email, status, features | `/shoes`, `/shoes/[id]`, cart | `/admin/shoes`, inventory editor | `views` counter + `order` reference never updates; verify donor metadata appears after donation → inventory conversion. | `npx playwright test testing/visitor-cart.spec.ts` + admin conversion check in Section 3.A |
| `shoerequests` | requestorInfo, items.shoeId/inventoryId, shippingInfo, statusHistory, shippingFee | `/checkout`, `/account` (Requests tab) | `/admin/requests` table + request dialog | Confirm shipping address persists for shipping method; ensure status history ordering correct. | `npx playwright test testing/run-workflows.mjs` + Section 2.C |
| `orders` | orderId, items, shippingAddress, paymentInfo, statusHistory | (none – not surfaced publicly) | `/admin/orders` page | **Critical:** no API creates orders; admin view will stay empty. See Section 5.1 for fix plan. | Section 1.2(c) inspection |
| `volunteers` | volunteerId, contact info, status | `/volunteer` form | `/admin/volunteers` | Ensure optional phone is handled (schema changed recently). | `npx playwright test testing/admin-volunteer-actions.spec.ts` |
| `interests` | interestId, type, subject, metadata | `/contact`, `/get-involved` | `/admin/interests` | Confirm metadata JSON persists and surfaces via admin filter. | Manual API pull (`GET /api/admin/interests`) |
| `settings` | shippingFee, maxShoesPerRequest, officers, social platforms | `/get-involved`, `/checkout`, `/shoes` notices | `/admin/settings` | Cache invalidation after save must be observed via `/api/settings`. | `npm run test:api -- --suite=health` + Section 2.D |

### 1.2 Audit Steps
A. **Schema sanity scripts**
1. `npx ts-node --transpile-only src/scripts/test-shoe-id-system.ts`
   - Confirms numeric `shoeId` generation, counter health, and sample queries.
2. `mongosh "$MONGODB_URI" --eval "db.getCollectionNames()"` to verify expected collections only.

B. **Collection sampling** (execute per collection):
```bash
mongosh "$MONGODB_URI" --eval 'db.donations.find({}, {donationId:1,isBayArea:1,pickupPreference:1,status:1}).limit(5).pretty()'
```
- Check for null/undefined fields listed in gap column.
- Capture mismatches in a scratch pad; attach to release report.

C. **Order existence check**
```bash
mongosh "$MONGODB_URI" --eval 'db.orders.countDocuments()'
```
- Expectation today: 0. If >0, confirm source (seed script vs runtime). Document results.

## 2. Application → Database Interaction Tests
| Flow | Expected Persistence | Automation | Manual Assertions |
|------|----------------------|------------|-------------------|
| Anonymous shoe donation | `donations` doc with donorInfo, status=submitted, numberOfShoes | `npx playwright test testing/run-donation-visibility.spec.ts` | Verify `db.donations.find({donorInfo.email: ...})` shows `pickupPreference:null`; screenshot admin dialog after update. |
| Money donation (offline check) | `moneydonations` doc with checkNumber, isOffline flag | Extend `testing/admin-manual-entry.spec.ts` or run admin dialog manually | Confirm status transitions update `statusHistory` + `receiptSent`. |
| Volunteer form | `volunteers` doc w/out phone when optional | `npm run test:workflows` (includes volunteer API) | `db.volunteers.find({email: ...})` shows `phone` absent and status `pending`. |
| Shoe request checkout (shipping) | `shoerequests` doc storing shippingInfo + shippingFee, decremented `shoes.inventoryCount` | `npm run test:workflows` (checkout scenario) | Inspect request via admin dialog; verify `items[].inventoryId` matches the shoe `_id`. |
| Profile update | `users` address + sports arrays updated; `account` view mirrors | `npm run test:api -- --suite=health` (profile check) | Diff `db.users.findOne({email:'newsteps.dev@gmail.com'})` before/after update script. |

## 3. Application ↔ Admin Parity Checks
| Scenario | Steps | Expected Outcome |
|----------|-------|------------------|
| Donation triage to inventory | Submit donation (Section 2), open `/admin/shoe-donations`, convert to inventory using "Convert to Inventory" flow, then inspect `/admin/shoes` and public `/shoes/[id]`. | Inventory item shows donor info, public listing becomes available only when `status=available`. |
| Shoe request lifecycle | Promote request via `/admin/requests` dialog through `approved → shipped`; reload user `/account` to see status + tracking. | Status history updates in DB, user sees updated badge. |
| Money donation receipts | Update status to `processed` with check number, trigger email (verify Gmail inbox or sendgrid logs). | `moneydonations` doc has `receiptSent:true` and `receiptDate` populated. |
| Volunteer moderation | Approve volunteer, confirm admin list + `/admin/volunteers` badge update, then check DB for `status:'approved'`. | Admin table and DB align. |
| Settings update | Change `shippingFee` in admin → call `curl http://localhost:3000/api/settings` → ensure new fee returned; check `checkout` totals without restart. | Cache invalidation works; `settings` doc updated with `lastUpdated`. |

## 4. Localhost Execution Sequence
1. Static & build gates: `npm run lint`, `npm run build`, `npm run type-check`.
2. API smoke: `npm run test:api -- --target=http://localhost:3000`.
3. Workflow suite: `npm run test:workflows`.
4. Run Section 1.2 scripts + collection sampling; log results.
5. Execute parity checks in Section 3 (mix of automation + manual) while application is running.
6. Capture evidence (screenshots, mongosh outputs) under `testing/reports/<release-date>-localhost.md`.

## 5. Gap Findings & Fix Plans
### 5.1 Orders never created (P0)
- **Evidence:** `db.orders.countDocuments()` stays 0; no code path calls `Order.create`.
- **Impact:** Admin Orders dashboard and shipping label workflow cannot function; release blocker for shipping program.
- **Fix Plan:**
  1. Update `/api/requests` POST to create an `Order` document when `deliveryMethod==='shipping'`, linking `shoeIds` and shipping address.
  2. Update shoes to set `order` reference and record status history notes.
  3. Add automated test in `testing/run-workflows.mjs` to assert order creation.
- **Verification:** After patch, rerun checkout flow, confirm `db.orders.findOne({orderId: ...})` exists and admin list shows it. Mirror on production after deployment.

### 5.2 Donation pickup preference not captured (P1)
- **Evidence:** Schema provides `pickupPreference`, `pickupDate`, `processingDate` yet public form/API never set them; admins rely on notes inference.
- **Impact:** Volunteers cannot tell if Bay Area donor prefers pickup vs drop-off, leading to coordination churn.
- **Fix Plan:**
  1. Add radio field to `/donate/shoes` form (pickup vs drop-off vs ship) wired to POST body (`pickupPreference`).
  2. Surface preference + scheduling fields in admin dialog; allow admin to set `pickupDate` / `processingDate`.
  3. Extend donation Playwright test to assert preference persists.
- **Verification:** Submit donation, inspect DB fields + admin UI; replicate on production once deployed.

### 5.3 Shoe views counter unused (P3)
- **Evidence:** `ShoeSchema.methods.incrementViews` unused; `views` stays 0.
- **Impact:** Analytics features relying on popularity may show incorrect data; low severity.
- **Plan:** Optional follow-up: call `incrementViews` inside `/shoes/[id]` API or page load, add unit check.

## 6. Promotion to Production
- Replay Sections 1–3 using production endpoints (swap `target=https://newsteps.fit` in API tests; run `mongosh` against read replica).
- Orders fix: validate `db.orders.countDocuments()` > 0 after first shipping checkout on production.
- Document prod evidence in `testing/reports/<release-date>-prod.md`, block release if Section 5.1 unresolved.

---
When all steps pass, update `TEST_PLAN.md` status tracker and proceed to deployment.
