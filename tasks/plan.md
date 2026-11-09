# Plan: Tilikstory — Penjualan Undangan Digital

Source of truth: `SPEC.md`. The initial 2026-11-09 survey found no application source, configuration, or test files; the workspace now contains a **partial greenfield scaffold** (source/config/test files present; still no `.git`). This plan uses the spec's **target** requirements and makes no claim about what is or is not implemented elsewhere.

## 0. Current state — gate status (read this first)

`SPEC.md` states the MVP "berjalan secara lokal melalui Docker" (TypeScript, Bun, Next.js, PostgreSQL). A full workspace survey (2026-11-09) found that **no application source, configuration, test files, or `.git` were present in the surveyed workspace** — historical; a greenfield scaffold has since landed (source/config files now exist; still no `.git`). Implementation status outside this workspace cannot be confirmed or refuted from here. **P1 RESOLVED (2026-11-09): the user explicitly approved greenfield scaffolding in this workspace using SPEC.md's named stack. The user subsequently reported "i have successfully run bun run test:auth"; no command output from that run is present here, so it is recorded as a user report, not captured evidence — P2/P4/T1 remain unchecked/unverified.**

**GATE STATUS (2026-11-09): P1, P3, P5 (P5a + P5b), and P8 are user-approved decision records, closed (approvals, not executions). P2/P4 have user-approved coarse proposals and a scaffold exists, but both records stay OPEN (unchecked): the only concrete execution evidence captured in this workspace shows `bun run test:auth` failing/stalling in Docker BuildKit at dependency/Prisma-engine downloads with `DNSResolveFailed` before any assertion ran — even with build-only host networking (Dockerfile `RUN --network=host` + Compose `build.entitlements: [network.host]`, which the builder accepted) — and a host-level `db:migrate:deploy` failing with Prisma P1001 (no published host port; the Compose-private path is the relevant one, unverified). The user's reported successful run is noted but, with no output captured, does not mark anything verified; T1 stays unchecked for the same reason. Earlier captured passes: `docker compose config -q`, host Prisma generate + app build, and the local unit suite. HRG is approved for non-provider implementation: T1, T3, and other provider-independent slices may proceed. Explicit boundaries unchanged: T2 is BLOCKED for clarification (its update acceptance is ambiguous while `account_profiles` has only `user_id`; SPEC unchanged) and CP-1 waits on it; T4/order creation stays BLOCKED until the published-only-orderable assumption is resolved — it is NOT approved; T6–T10 remain unexercisable until genuine server-confirmed payment exists (never a manual "paid" or a mock); P6/P7 provider checks explicitly remain blocked and are not started.** Greenfield approval is *prudential* — required because the existing source location was unknown (to avoid duplicating or clobbering real work) — not a claim that the stack choice is frozen; the TypeScript/Bun/Next.js/PostgreSQL + local-Docker combination is simply what SPEC.md currently names, and changing it needs the spec's own approval gate. Commands, layout, and test topology are recorded only from verified actual configuration; P2/P4 close on captured concrete evidence, never invented. Remaining tasks still record `Files: unknown` until their own slices land.

**Scope-estimation rule:** the S/M tags below are **tentative** (the scaffold exists but its integration path is unverified by captured evidence, so nothing final exists to size against); no day/duration claims are made, and no per-task file counts are asserted. At implementation time, if any slice is found to touch **more than 5 files, it MUST be split into smaller vertical slices before starting it.**

## (a) Dependency graph — exactly per SPEC.md "Peta Kapabilitas Produk"

| Module | Depends on (per spec) |
|---|---|
| `template-catalog` | — (no capability dependency; public browsing, no account) |
| `checkout` | `template-catalog` |
| `invitation-editor` | `template-catalog`, `checkout` |
| `admin-ops` | `template-catalog`, `checkout` |
| `guest-delivery` | `invitation-editor` **only** |

`invitation-editor` ∥ `admin-ops`: parallelizable after `checkout`. Target order per spec: `template-catalog` → `checkout` → (`invitation-editor` ∥ `admin-ops`) → `guest-delivery`. There is **no** admin-ops→guest-delivery capability edge in the spec.

```
template-catalog ──► checkout ──┬─► invitation-editor ──► guest-delivery
                                └─► admin-ops
```

**Prerequisite (not a spec module):** authentication + sessions + ownership per SPEC §T2 (PostgreSQL sessions, httpOnly/SameSite cookies, `account_profiles`, server-side ownership) gates the **protected flows only** — `checkout`, `invitation-editor`, `admin-ops`, `guest-delivery`. It is NOT a dependency of public catalog browsing (`template-catalog`), which requires no account.

Terminology note: SPEC uses **publish** (menerbitkan/menerbitkan template) and **deactivate** (menonaktifkan template; for invitations "di-unpublish"). This plan uses publish/deactivate throughout.

## (c) Preflight — non-feature gate (decisions & environment, not product slices)

Produces no user-facing behavior; MUST NOT be counted as feature progress.
### <a id="p1-source-location"></a>P1 — Source location (RESOLVED 2026-11-09: greenfield approved)
Confirm where the SPEC-referenced local-Docker MVP actually lives (the surveyed workspace had no application source/config/test files), or obtain user approval to scaffold fresh here using the stack named by SPEC.md. Deliverable: a source-location decision and repo-layout statement; do not invent paths.
**Decision record:** the user approved greenfield scaffolding in this workspace (`/Users/dimasaf/Documents/tilikstory`) using SPEC.md's named stack (TypeScript, Bun, Next.js, PostgreSQL; local Docker). The scaffold has since landed — source/config/test files now exist (still no `.git`); P1 stays approved/resolved. The user additionally reported "i have successfully run bun run test:auth"; no command output from that run is present here, so it is noted as a user report while P2/P4/T1 remain unchecked pending captured evidence. Per HRG (2026-11-09, non-provider scope only): P3, P5a/P5b, P8 records are approved/closed; P2/P4 proposals are approved but OPEN; P6/P7 provider checks stay explicitly blocked; the T4 published-only-orderable assumption and T2 clarification stay gated.

### <a id="p2-project-commands-structure"></a>P2 — Project commands and structure
Record the applicable startup/dev/build/migration/test commands and directory layout from the actual project configuration; SPEC deliberately does not fix them. Verification commands depend on this.
**Coarse proposal approved 2026-11-09; record OPEN (unchecked), scaffold present:** one root Next.js App Router app, Bun scripts, local Docker Compose stack (app + PostgreSQL + Mailpit). Captured passes so far: `docker compose config -q`, host Prisma generate, host app build, and the local unit suite. Captured failure: `bun run test:auth` stalled/failed in Docker BuildKit at dependency/Prisma-engine downloads with `DNSResolveFailed` before any assertion ran (build-only host networking accepted by the builder); host `db:migrate:deploy` failed Prisma P1001 (no published host port) — the Compose-private migration path is the relevant one and is unverified. The user reported a successful `test:auth` run; that report is recorded, but with no output captured it does not close this record. Closes only on verified actual files, commands, and layout — never invented.

### <a id="p3-orm-driver"></a>P3 — PostgreSQL ORM/driver
SPEC leaves the ORM/driver open. For a confirmed greenfield project, choose one and record the decision; otherwise follow the existing project configuration.
**Decision record (APPROVED 2026-11-09):** Prisma ORM v7 with `@prisma/adapter-pg` + `pg`, pinned to v7 versions, against the local self-hosted PostgreSQL instance.

### <a id="p4-local-auth-test-topology"></a>P4 — Local PostgreSQL/Mailpit auth-test topology
For T1/T2 auth and ownership integration tests only, configure PostgreSQL and Mailpit on the local Docker stack through loopback (host-published ports bound to `127.0.0.1`) or a private Docker Compose network. Tests must verify endpoint confinement and fail closed for public/hosted/external endpoints; no hosted fallback or mocks. P4 does not cover Midtrans or WhatsApp provider testing.
**Coarse proposal approved 2026-11-09; record OPEN (unchecked), scaffold present:** integration tests run on the private Docker Compose network; no provider services, no mocks; runtime `auth-private` remains `internal: true`. The topology has NOT been exercised with captured evidence: the only observed `bun run test:auth` execution (build app + `integration` run on `auth-private`) stalled/failed in Docker BuildKit downloads with `DNSResolveFailed` before assertions, even with build-only host networking. The user reported a successful run of the same command; recorded as a user report — with no output captured it does not close this record. Closes only when the topology is actually verified.

### <a id="p5-starter-content"></a>P5 — Starter template content/assets/pricing/currency
Recorded as one decision with two explicit subdecisions:
- **P5a — Starter template content + preview assets:** initial wedding/birthday template content and preview assets needed for the T3 public catalog. Categories are already specified.
- **P5b — Prices/currency:** prices and currency needed for T4 order creation/checkout.
P5 (P5a + P5b) does not include admin-role provisioning. T3 depends on P5a only — not P5b and not P8; T4 depends directly on P5b.
**Decision records (APPROVED 2026-11-09):**
- **P5a:** four original starter concepts approved — *Kembang Pagi*, *Senja di Serambi*, *Pesta Ria*, *Malam Gemerlap* — seeded as published templates with original preview assets.
- **P5b:** uniform one-time price **Rp99.000 (IDR)**; each order snapshots the amount and currency at creation.

### <a id="p6-midtrans-test-topology"></a>P6 — Midtrans sandbox and provider-test topology
Confirm sandbox key availability and merchant-activated payment methods (QRIS/VA/e-wallet as activated), plus the permitted inbound server-notification and provider-test topology for the SPEC-required Midtrans coverage. Do not assume tunnels, external calls, mocks, or fallbacks. T5 provider-dependent coverage remains blocked until P6 resolves; non-provider local tests remain runnable.

### <a id="p7-whatsapp-test-topology"></a>P7 — WhatsApp provider-test prerequisites/topology
Confirm provider test prerequisites and the permitted topology for the SPEC-required WhatsApp test-environment coverage, including availability of approved templates and any provider-specific test setup. Do not assume external calls, mocks, or fallbacks. T15 provider-dependent coverage remains blocked until P7 resolves; non-provider local tests remain runnable.

### <a id="p8-admin-role-provisioning"></a>P8 — Admin-role provisioning
Decide how the first authorized admin is provisioned; SPEC requires admin operations but does not define provisioning.
**Decision record (APPROVED 2026-11-09):** a one-off operator CLI promotes an already-verified user via `users.isAdmin` (default `false`); no public endpoint exists for role promotion.

### <a id="hrg-human-review"></a>Human-review gate (HRG)
Before implementation, the user reviews and approves the P1–P8 decision records and the flagged assumptions below. P6/P7 may remain explicitly unresolved/blocked for provider coverage; that blocks only the provider-dependent checks called out below, not local non-provider work. Greenfield approval is prudential because the existing source location was unknown; the user gave that prudential approval on 2026-11-09 (see P1 decision record), and HRG still covers the full P1–P8 records.
**Approval record (2026-11-09): HRG approved for non-provider implementation.** Scope boundary — authorized to proceed: T1, T3, and other provider-independent slices (given the P3/P5/P8 records; P2/P4 proposals approved but their records stay OPEN pending captured verification). Execution status: the user reported a successful `bun run test:auth`; no output was captured, so T1 stays unchecked/unverified and T3 is not started. Explicitly NOT approved / still gated: P6/P7 provider checks stay blocked and are not started; the T4 published-only-orderable assumption is unresolved, so T4/order creation stays blocked; T2 is blocked for clarification (update-acceptance ambiguity while `account_profiles` is `user_id`-only — SPEC left unchanged) and CP-1 waits on it; T6–T10 stay unexercisable until genuine server-confirmed payment exists (no manual "paid", no mock). HRG fully closes when the P6/P7 records resolve or are consciously dispositioned and the task-scoped assumptions above are answered.


## (b) Vertical end-to-end tasks

Each task is a working slice (server-validated behavior + its UI/route + its tests), not a horizontal layer. All slices tentative-S/M (see scope rule). `Files: unknown`, commands pending P2.

### Phase 1 — Prerequisite for protected flows: account, session, ownership (SPEC §T2)

*ID note: plan task `T2` is a task identifier, distinct from `SPEC §T2`, the spec's "Kontrak Akses Akun dan Keamanan" (account-access/security contract) cited by T1–T2.*

#### <a id="t1-account-auth"></a>T1 — Register → confirm email → sign-in → sign-out *(criterion 1's account part)*
- Acceptance:
  1. Registration creates a user + unverified state; confirmation via Mailpit uses a callback accepting only `token_hash` + `type=email`, verifying single-use tokens; invalid confirmation input rejected.
  2. Sessions stored in PostgreSQL; cookie httpOnly + SameSite (+ Secure in production); every server request revalidates the session; sign-out ends only the current browser session.
  3. Post-confirm redirect strictly same-origin with token/auth params stripped; tokens never logged; callback responds `Cache-Control: no-store` + `Referrer-Policy: no-referrer`.
- Verify via: exactly SPEC §T2's auth integration-test list — unverified registration, email confirmation, sign-in, local sign-out, invalid confirmation input, and protected-route rejection — using only local-Docker PostgreSQL/Mailpit via loopback (`127.0.0.1`-bound published ports) or a private Compose network. Verify endpoint confinement and fail closed for public/hosted/external endpoints; no hosted fallback or mocks. Non-provider; locally runnable once P1–P4 are in place.
- Dependencies: P1, P2, P3, P4 (local auth-test topology only; no P6/P7). Files: unknown. Scope: M (tentative).
- Status (2026-11-09): **unchecked / unverified by captured evidence** — the user reported "i have successfully run bun run test:auth" (recorded as a user report), but no command output from that run is present here, and the only captured execution evidence shows the run stalling/failing in Docker BuildKit downloads (`DNSResolveFailed`) before any SPEC §T2 auth integration assertion ran. Host-level generate/build and unit-suite passes do not substitute for the P4 private-Compose integration cases; T1 closes only on captured integration evidence.

#### <a id="t2-account-ownership"></a>T2 — Ownership enforcement + `account_profiles` *(SPEC §T2)*
- Acceptance:
  1. Minimal table `account_profiles`: `user_id` primary key + foreign key to the app's `users` table; no other profile fields in scope.
  2. Access only via Next.js server code with a verified session; session identity — never a caller-supplied user ID — determines the owner; no service-role client, no public API.
  3. User A cannot read or modify user B's rows, including through API routes.
- Verify via: cross-user read/update ownership integration tests including API routes, under the same P4/SPEC §T2 local-only fail-closed endpoint rule.
- Dependencies: T1, P4 (local auth-test topology only; no P6/P7). Files: unknown. Scope: M (tentative).
- Status (2026-11-09): **BLOCKED for clarification** — the cross-user **update** acceptance is ambiguous while `account_profiles` carries only `user_id` (PK/FK; no profile fields in scope, so there is nothing to update); SPEC's "baca dan update" is left unchanged. Clarify with the user before implementing T2. Read-side ownership denial and T1 itself remain runnable under the non-provider HRG approval.

#### <a id="cp-1-auth-checkpoint"></a>CP-1 — Auth + ownership checkpoint after T1–T2: local integration suites green; fail-closed P4 endpoint guard passes; human spot-check of cookie attributes. Do not proceed if red.

### Phase 2 — template-catalog (public; no capability dependency, no account)

#### <a id="t3-public-catalog"></a>T3 — Public catalog: browse, filter, preview, select *(criterion 1's selection part)*
- Acceptance:
  1. Public browsing — no account — of catalog templates in the SPEC-specified wedding vs. birthday categories with clear navigation/filter; template preview visuals are the primary focus.
  2. Clear view and select actions; select hands off to checkout (which requires the Phase-1 account).
  3. Mobile-first + accessible per SPEC "Arah UI": keyboard-usable labeled controls, sufficient contrast, status never by color alone, reduced-motion respected; Tilikstory's own identity (ChainGPT Labs = approach reference, not a copy target).
- Verify via: catalog-slice tests for category filtering, preview, and select flow on the local stack; UI-direction/accessibility review. Catalog content seeded per P5a (starter template content/preview assets).
- Dependencies: P5a only — not P5b, no P8/admin-provisioning dependency. Files: unknown. Scope: M (tentative).
- Status (2026-11-09): may proceed under the non-provider HRG boundary (P5a approved); **not started; unchecked.**

#### <a id="cp-2-catalog-checkpoint"></a>CP-2 — Public catalog checkpoint after T3: demo filter/preview/select on P5a-seeded content and accessibility review. No admin-publishing demo; template administration is T11 after checkout.

### Phase 3 — checkout (T4: protected-flow prerequisites + catalog; T5 provider coverage gated only by P6; no admin tasks)

#### <a id="t4-order-creation"></a>T4 — Order creation for a selected template *(criterion 1's order part)*
- Acceptance:
  1. A signed-in customer creates an order from a catalog-selected template; the order is stored server-side, linked to the account, with initial pending-payment status.
  2. *[ASSUMPTION — gated]* Orders can only be created for **published** templates (validated server-side). SPEC states publish/deactivate for admins but does not explicitly define orderability of deactivated templates — NOT covered by the 2026-11-09 non-provider HRG approval; approve or amend only via explicit user sign-off; see §Open decisions.
  3. Checkout screens follow the SPEC "alur pelanggan" direction: readability-first, mobile-first, keyboard-operable labeled controls, status not color-only (no heavy hero decoration on work screens).
- Verify via: unit tests (order initial-state rules); integration tests (ownership, server-side validation); checkout accessibility/responsive review.
- Dependencies: T1, T2, T3, P5b (prices/currency, direct). Files: unknown. Scope: M (tentative).
- Status (2026-11-09): **BLOCKED** — the published-only-orderable assumption (acceptance 2) is NOT approved and was excluded from the non-provider HRG approval; T4/order creation stays blocked until the user explicitly resolves it.

#### <a id="t5-midtrans-payment"></a>T5 — Midtrans Snap sandbox payment + server-confirmed status *(criteria 2, 3 gate, 8)*
- Acceptance:
  1. A pending order starts payment via Midtrans Snap sandbox with merchant-activated methods only (QRIS/VA/e-wallet per activation — no promise beyond activated methods).
  2. Payment status transitions ONLY from Midtrans server notifications, validated on the server; Midtrans notification is the sole status source; a browser redirect result is never payment proof.
  3. No manual "mark success" write path and no refund flow exist anywhere; editor/publish access for the owner unlocks only on server-confirmed payment.
- Verify via: **locally runnable** — unit tests for payment rules/order status (redirect is not proof; no manual-success path) and local non-provider integration tests. **Provider-dependent Midtrans sandbox/webhook coverage is BLOCKED until P6 resolves**; do not assume a tunnel, external call, mock, or fallback, and do not substitute weaker checks.
- Dependencies: T4. Provider-dependent coverage only: P6. Files: unknown. Scope: M (tentative).

#### <a id="cp-3-checkout-checkpoint"></a>CP-3 — Checkout checkpoint after T4–T5: non-provider status tests/audit remain runnable; sandbox payment → server-notification confirmation demo is blocked until P6 resolves. Provider portion is not green until its coverage passes.

### Phase 4 — invitation-editor ∥ admin-ops (spec-parallel tracks; both depend on template-catalog + checkout)

**Track A — invitation-editor**

*Status (2026-11-09): T6–T10 remain unexercisable end-to-end until genuine server-confirmed payment exists (criterion 3); never fabricate exercise with a manual "paid" write or a mock — unit-level rule tests alone do not unlock these slices.*

#### <a id="t6-event-editor"></a>T6 — Editor: event-field draft editing, payment-gated *(criterion 4, fields half)*
- Acceptance:
  1. Editor reachable only for orders with server-confirmed payment (criterion 3), ownership enforced; fixed template fields only — NO free design editor.
  2. Shared fields (title/greeting, date + time, venue name + address, optional map link, cover photo + gallery slots) plus wedding fields (couple names; akad/ceremony and reception schedule/location) and birthday fields (name, optional age, event date/time/location).
  3. Editor screens readability-first/mobile-first/accessible per SPEC "alur pelanggan"; every field validated server-side.
- Verify via: editor-slice unit tests — event-field validation per category + editor access rule; integration test (draft visible only to owner).
- Dependencies: T3, T5 (unlock semantics; local-rule tests may proceed under T5's blocked/unblocked split). Files: unknown. Scope: M (tentative).

#### <a id="t7-photo-upload"></a>T7 — Photos: upload validation + private draft serving *(criterion 4, photos half)*
- Acceptance:
  1. Uploads validated server-side: JPEG/PNG/WebP only, ≤5 MiB per photo, ≤5 photos per invitation; rejections are clear and server-confirmed.
  2. Photos stored on the local Docker volume (SPEC target); no cloud/object storage without approval.
  3. Draft invitations and their photos are private — served only through authenticated routes; no public exposure before publish; sensitive guest data never logged.
- Verify via: integration tests (volume storage, format/size/count rejection, private-route access). Non-provider; locally runnable.
- Dependencies: T6. Files: unknown. Scope: M (tentative).

#### <a id="t8-publish-public-link"></a>T8 — Publish → public link; deactivate; link visibility *(criterion 5; part of 3)*
- Acceptance:
  1. Publishing produces a shareable public link; guests open it **with no account** (SPEC objective: "Tamu dapat membuka undangan melalui tautan publik tanpa akun"); published photo assets served publicly via the app route.
  2. Deactivating ("di-unpublish") immediately revokes public access.
  3. At publication, the customer is explicitly notified that the published invitation and its photos are visible to anyone holding the link; layout keeps template visuals + photos as the focus, readable on mobile.
- Verify via: E2E publish/share/deactivate segment; integration tests public vs. authenticated route access; public-invitation responsive/accessibility review.
- Dependencies: T7. Files: unknown. Scope: M (tentative).

#### <a id="cp-4-editor-checkpoint"></a>CP-4 — Editor checkpoint after T6–T8: demo confirmed-payment unlock → fields → photos → publish → public link on phone → deactivation revokes access.

#### <a id="t9-invitation-retention"></a>T9 — Invitation lifecycle & data retention: link auto-deactivation + draft/photo 90-day purge *(invitation-editor data rules)*
- Acceptance:
  1. The public link auto-deactivates 30 days after the event date.
  2. Private drafts and their photos are kept **90 days after deactivation**, then deleted (DB rows + local-volume files); the customer can delete an invitation and its photos earlier.
  3. Order/payment data is not part of this purge: per SPEC it is kept separately, following applicable record-keeping obligations.
- Verify via: unit tests (30-day auto-deactivate + 90-day purge cut-off rules); integration tests (rows + volume files actually removed; early delete). Mechanism (scheduled job vs. request-time sweep) is unspecified in SPEC — decide at implementation, do not invent silently.
- Dependencies: T8. Files: unknown. Scope: M (tentative).

#### <a id="t10-customer-invitation-management"></a>T10 — Customer invitation management: list, reopen, manage *(SPEC objective: "Pelanggan memakai akun untuk mengelola undangan")*
- Acceptance:
  1. A signed-in customer sees a list of their own invitations across states (draft / published / deactivated) — ownership enforced server-side.
  2. The customer can reopen a draft (edit fields/photos within payment-confirmed and retention rules), publish/deactivate, delete early, and reach the shareable link + guest tools for each.
  3. Management screens are readability-first, mobile-first, keyboard-operable with labels, status not color-only (SPEC "alur pelanggan").
- Verify via: integration tests (list shows only own invitations; state transitions); management accessibility/responsive review; E2E segment reopen→edit→republish.
- Dependencies: T8, T9 (state semantics). Files: unknown. Scope: M (tentative).

#### <a id="cp-5-lifecycle-checkpoint"></a>CP-5 — Lifecycle checkpoint after T9–T10: demo list → reopen → edit → republish/deactivate; early deletion works; retention-rule unit tests pass.

**Track B — admin-ops (parallel to Track A; positioned after checkout per spec dependency)**

#### <a id="t11-admin-template-management"></a>T11 — Admin template management: create / edit / publish / deactivate *(criterion 7, template half)*
- Acceptance:
  1. Admin can create, edit, publish, and deactivate templates in both SPEC categories.
  2. Template field definitions validated server-side on every mutation (unit-testable here per SPEC test strategy "validasi field template").
  3. Admin endpoints require authentication + server-side admin authorization; non-admin access rejected.
- Open decision (do NOT assert a rule): what template deactivation implies for pending orders and existing invitations of that template — SPEC silent; resolve with the user before building the deactivation flow. The only-published-orderable guard in T4 is likewise an HRG-approved assumption.
- Verify via: unit tests (template field validation); integration tests (admin authorization; published-template visibility in catalog).
- Dependencies: T3, T4, T5 (spec: `admin-ops` ← catalog + checkout), T1 authentication, P8 admin-role provisioning. Files: unknown. Scope: M (tentative).

#### <a id="t12-admin-order-operations"></a>T12 — Admin order operations: view, change, cancel *(criterion 7 order half; criterion 8)*
- Acceptance:
  1. Admin can view orders and change or cancel order states within product scope.
  2. Payment status stays provider-derived and read-only for admin: no manual "success", no refund action anywhere (refunds out of scope, never added).
  3. All admin order endpoints require authentication + server-side admin authorization.
- Open decision: SPEC permits admin order changes/cancellation but does not define allowed transitions or effects, especially for already-paid orders. Resolve with the user before implementation; do not invent transitions or add refunds.
- Verify via: integration tests (authorization and user-approved transitions; rejection of manual-success/refund attempts). Non-provider; locally runnable after the open transition decision and local status setup.
- Dependencies: T5, T11 (admin surface), T1 authentication, P8 admin-role provisioning. Files: unknown. Scope: M (tentative).

#### <a id="cp-6-admin-checkpoint"></a>CP-6 — Admin checkpoint after T11–T12: demo template lifecycle feeding the public catalog and admin order controls; verify payment status remains provider-derived and cannot be manually marked successful.

### Phase 5 — guest-delivery (depends on invitation-editor only)

#### <a id="t13-guest-csv-import"></a>T13 — Guest CSV import + opt-in declaration *(criterion 6, import half)*
- Acceptance:
  1. Import requires the customer's declaration that recipients marked opt-in agreed to be messaged.
  2. Header schema enforced server-side: `phone_e164` (required, international format), `whatsapp_opt_in` (required, `true`/`false`), `opted_in_at` (required for opt-in rows), `name` (optional).
  3. The importing account and import time are recorded; **valid non-opt-in rows are preserved** in the contact list (they belong to T14's manual-sharing path) and are never eligible for automated send.
- Open decision (row-error handling): SPEC does not state whether an invalid row/file is wholly rejected or partially imported with per-row errors. Design the error-handling policy with the user at implementation; do not pre-assume whole-file rejection.
- Verify via: unit tests (CSV parser incl. per-row outcomes, opt-in filter); integration import against the customer's own published invitation.
- Dependencies: T8 (published invitation), T2/T10 (ownership + management surface). Files: unknown. Scope: M (tentative).

#### <a id="t14-manual-link-sharing"></a>T14 — Manual link sharing for guests outside automated send *(criterion 6 tail)*
- Acceptance:
  1. Invalid or non-opt-in contacts receive **no automated message** (hard guard, unit-test proven).
  2. The customer gets the public invitation link together with the guest list of recipients not eligible for automated send, for manual sharing.
  3. No automated-send path exists for ineligible contacts.
- Verify via: unit tests (guard + list-filter correctness); E2E segment of the manual-share flow.
- Dependencies: T13. Files: unknown. Scope: S (tentative).

#### <a id="cp-7-csv-sharing-checkpoint"></a>CP-7 — CSV import + manual-sharing checkpoint after T13–T14: demo import (valid non-opt-in rows preserved; approved row-error policy applied) → manual-link list for ineligible recipients; automated-send guard proven on non-provider paths. Non-provider; locally runnable.

#### <a id="t15-whatsapp-send"></a>T15 — WhatsApp Cloud API automated send to opt-ins only *(criterion 6, delivery half)*
- Acceptance:
  1. Automated sends go ONLY to opted-in recipients via Meta WhatsApp Cloud API using approved templates; a server-side guard blocks every other automated send.
  2. Per-guest delivery status is recorded; sensitive guest data never logged; API secrets stay server-side, uncommitted.
  3. Delivery records feed the T16 contact/delivery retention clock (30 days after event).
- Verify via: unit tests (opt-in + approved-template guard) and local non-provider integration tests are runnable. **Provider-dependent sends/test coverage are BLOCKED until P7 resolves**; do not assume external calls, mocks, or fallbacks.
- Dependencies: T13. Provider-dependent coverage only: P7. Files: unknown. Scope: M (tentative).

#### <a id="t16-contact-retention"></a>T16 — Contact-list & delivery-status retention (guest-delivery data rule)
- Acceptance:
  1. Guest contact lists and delivery statuses are deleted **30 days after the event date**; the customer can delete them earlier.
  2. Contact/delivery data is never used for marketing.
  3. Purge of contacts/delivery statuses does not touch order/payment data (kept separately per SPEC).
- Verify via: unit tests (30-day cut-off); integration tests (rows removed; early delete). Mechanism same open question as T9 — decide once, reuse.
- Dependencies: T13–T15. Files: unknown. Scope: M (tentative).

#### <a id="cp-8-send-retention-checkpoint"></a>CP-8 — WhatsApp-send + contact-retention checkpoint after T15–T16: opt-in/approved-template guard checks and retention purge (30-day cut-off + early delete; order/payment data untouched) verified locally. Provider send verification remains blocked until P7 resolves; non-provider local tests stay runnable.

### Phase 6 — product acceptance

#### <a id="t17-end-to-end-acceptance"></a>T17 — End-to-end acceptance walkthrough *(all 8 SPEC criteria)*
- Acceptance:
  1. One E2E path on the local stack: choose template → checkout → sandbox payment confirmed (server notification) → fill data/photos → publish link → import CSV → WhatsApp send to opt-ins only / manual link for others → deactivate → retention clocks observable.
  2. Every SPEC criterion 1–8 traced to concrete evidence (test names / walkthrough notes); out-of-scope items (refund, RSVP, guestbook, free design editor) confirmed absent.
  3. Constraints register holds end-to-end: secrets uncommitted, redirect-never-proof, no manual success, opt-in guard + approved templates, both retention rules honored, guests need no account; responsive/accessibility spot-review across catalog, checkout, editor, management, public invitation.
- Verify via: E2E suite per SPEC's test strategy + human review against "Kriteria Keberhasilan Produk". Local non-provider portions remain runnable; full provider-dependent E2E coverage requires both P6 and P7 resolved. Production gate stays deferred per SPEC until a hosting decision.
- Dependencies: all prior tasks. Provider-dependent E2E coverage: P6 + P7. Files: unknown. Scope: M (tentative).

#### <a id="cp-9-final-review"></a>CP-9 — Final human delivery review after T17.

## (d) Phase & gate sequence

```
P1–P8 (preflight decisions) → HRG (review/approve P1–P8; P6/P7 may remain explicitly provider-blocked)
→ Phase 1: T1, T2 → CP-1                    (protected-flow prerequisite; local P4)
→ Phase 2: T3 → CP-2                         (public catalog only; P5a content)
→ Phase 3: T4, T5 → CP-3                     (T4 needs P5b pricing; T5 provider coverage blocked only by P6)
→ Phase 4 Track A: T6, T7, T8 → CP-4         (editor)
              T9, T10 → CP-5                 (lifecycle + customer management)
→ Phase 4 Track B: T11, T12 → CP-6           (admin-ops after checkout; P8 provisioning)
→ Phase 5: T13, T14 → CP-7                    (CSV import + manual sharing; non-provider, runnable)
              T15, T16 → CP-8                  (send + retention; provider coverage blocked only by P7)
→ Phase 6: T17 → CP-9                           (full provider E2E requires P6 + P7)
```
Checkpoints follow the dependency graph. Run all locally runnable unit and non-provider integration checks at their slice checkpoints using P2 commands. Provider-dependent coverage remains explicitly blocked until its named topology decision resolves; confirm scope/security constraints before proceeding. Track B may interleave with Track A after checkout; its provider-independent tests remain runnable.

## Criteria traceability

| SPEC criterion / requirement | Covered by |
|---|---|
| 1. account + template choice + order | T1, T3, T4 |
| 2. pay via activated Midtrans methods | T5 |
| 3. editor/publish only after server-confirmed payment | T5 (unlock), T6, T8 (enforce) |
| 4. fields + photos, no free design editor | T6, T7 |
| 5. public shareable link; guests need no account | T8 (+T14 manual share list) |
| 6. CSV import; WhatsApp opt-in-only w/ approved templates; others get link | T13, T14, T15 |
| 7. admin create/edit/publish/deactivate templates; order change/cancel | T11, T12 |
| 8. provider-sourced status; no manual success; no refund | T5, T12 |
| Objective: customer manages invitations via account (list/reopen/manage) | T10 |
| Photo/draft retention: 90 days after deactivation + early delete | T9 |
| Contact/delivery retention: 30 days after event + early delete; no marketing | T16 |
| Notification at publish that invitation/photos are link-visible | T8 |
| Approved WhatsApp templates / opt-in guard | T15 (+P7 confirmation) |
| SPEC UI direction + responsive/accessibility across screens | T3 (catalog), T4 (checkout), T6 (editor), T10 (management), T8 (public invitation) |

## Constraint register (from SPEC.md — applies to every task)

- **Always:** server-side validation at every boundary (forms, API, CSV, webhooks, uploads, external responses); Midtrans server notification = sole payment-status truth; auth + ownership checked on every protected access; auto-WhatsApp only to opted-in recipients with approved templates; secrets server-side, never committed; card data never stored in-app; guest data never logged; notify customer that published invitations/photos are link-visible.
- **Never:** treat browser redirect as payment proof; manually flip payment to success; auto-message non-opt-in contacts; add refund flows to this scope.
- **Ask before changing:** payment/WhatsApp/hosting/storage providers (incl. local→cloud object storage); personal-data categories or retention periods; scope of refund/RSVP/guestbook/free-design-editor/multi-vendor/marketing; the TypeScript/Bun/Next.js/PostgreSQL + local-Docker target currently named in SPEC.
- **Integration test topology — SPEC §T2 (scope: auth/ownership integration tests):** PostgreSQL/Mailpit via loopback (`127.0.0.1`-bound published ports) or a private Docker Compose network only, as SPEC §T2 states; fail-closed for public/hosted/external endpoints; no hosted fallback, no mocks; no production credentials, none committed.
- **Provider-dependent verification:** Midtrans coverage at T5/CP-3 is blocked only until P6 resolves; WhatsApp coverage at T15/CP-8 is blocked only until P7 resolves; full provider E2E at T17 requires both P6 and P7. No tunnel, external call pattern, mock, or fallback is assumed. Local non-provider tests remain runnable.

## Open decisions (surface, do not silently decide)

1. **Only-published-templates-orderable** (used in T4) — assumption, not stated by SPEC; still gated: NOT covered by the 2026-11-09 non-provider HRG approval, awaits explicit approve/amend.
2. **Effect of template deactivation** on that template's pending orders and existing published invitations — SPEC silent; resolve before T11's deactivation flow.
3. **Admin order-state transitions and cancellation effects**, especially on already-paid orders — SPEC permits admin changes/cancellation but defines neither allowed transitions nor their effects. Resolve before T12; do not invent transitions or refunds.
4. **CSV row-error handling** — whole-file vs partial import with per-row errors — SPEC silent; decide with the user at T13.
5. **Retention mechanism** (scheduled job vs request-time sweep) — SPEC silent; decide once, applies to T9 and T16.
6. **Midtrans provider-test topology** — P6; T5 provider coverage remains blocked until resolved.
7. **WhatsApp provider-test prerequisites/topology** — P7; T15 provider coverage remains blocked until resolved.
8. **Starter template content/assets + pricing/currency** — RESOLVED 2026-11-09 (P5): P5a four original concepts (Kembang Pagi, Senja di Serambi, Pesta Ria, Malam Gemerlap) seeded published with original assets; P5b uniform Rp99.000 one-time IDR with amount/currency snapshotted per order.
9. **Admin-role provisioning** — RESOLVED 2026-11-09 (P8): one-off operator CLI promotes an already-verified user via `users.isAdmin` (default `false`); no public endpoint.

## (e) Risks

1. **Scaffold present; integration verification gap (2026-11-09).** The initial survey found no source; P1 resolved by greenfield approval and a scaffold now exists (source/config/test files; no `.git`). The user reported a successful `bun run test:auth`, but no output from that run was captured here; the only captured execution evidence shows the run stalling/failing in Docker BuildKit at dependency/Prisma-engine downloads with `DNSResolveFailed` (even with build-only host networking), plus host `db:migrate:deploy` P1001 (no published host port; Compose-private path unverified). P2/P4/T1 therefore stay unchecked; closing them needs captured successful evidence from the private-Compose path.
2. **Starter catalog resolved (P5a/P5b, 2026-11-09):** approved content/preview assets (four original concepts) and uniform Rp99.000 IDR pricing with per-order snapshots remove the demonstration unknowns; residual work is seeding them when the scaffold lands. Admin CRUD arrives later after checkout.
3. **Admin provisioning resolved (P8, 2026-11-09):** operator CLI + `users.isAdmin` (default false, no public endpoint); residual is building the CLI within T11/T12 authorization scope.
4. **Midtrans coverage blocked (P6):** sandbox prerequisites, activated methods, and notification/test topology are unresolved; T5 provider coverage and the Midtrans leg of T17 remain blocked. No tunnel/external-call/mock/fallback is assumed.
5. **WhatsApp coverage blocked (P7):** provider test prerequisites/topology are unresolved; T15 provider coverage and the WhatsApp leg of T17 remain blocked.
6. **Provider-test tension:** SPEC requires Midtrans/WhatsApp integration coverage and local-Docker E2E while T2 sets a strict local-only/no-mock rule for auth/ownership tests. P6/P7 must resolve permitted provider test topologies without weakening P4 or assuming a method.
7. **ORM decided (P3, 2026-11-09: Prisma v7 + @prisma/adapter-pg + pg); commands/layout still open (P2):** the P2 coarse proposal is approved but verification commands remain undetermined until the scaffold is built and recorded from the real configuration; no defaults are invented.
8. **Admin order transitions/cancellation** (open decision 3): already-paid effects are unspecified; do not invent transitions or refunds.
9. **Deactivation/retention/CSV semantics** (open decisions 2, 4, 5): resolve before implementing those flows.
10. **Intentional-scope absences** (refund, RSVP, guestbook, free design editor): any request to add them triggers SPEC's approval-before-change clause.
