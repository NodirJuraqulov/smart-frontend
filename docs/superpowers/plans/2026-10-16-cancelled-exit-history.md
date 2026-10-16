# Cancelled Exit History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the cancelled-exit history tab and remove the emergency-history frontend surfaces explicitly named by the approved TZ.

**Architecture:** The new tab owns its date-range and pagination state, queries the existing exit-candidates API module, and renders authenticated image previews. SessionsPage controls role visibility. Existing emergency barrier functionality and existing emergency-compatible candidate types remain untouched.

**Tech Stack:** React 19, TypeScript, Ant Design, TanStack Query, Axios, Vitest, Testing Library, i18next.

**Spec:** User-approved conversation TZ dated 2026-10-16.

## Global Constraints

- Work in the existing main folder; do not create a worktree or branch.
- Do not commit or push.
- Write clean production code without comments.
- Do not add npm packages.
- Do not change EmergencyBarrierAction, its settings, APIs, or existing emergency-compatible types.
- Remove only emergency history UI/API/tests/types/locales and the forced-open emergency column/locales.
- Preserve all unrelated tabs, modals, actions, and flows.

## Review Focus

- Nullable `detected_plate` and `resolved_by` must render as `—` without throwing.
- `has_image: false` must not fetch or render an image preview.
- Inclusive ranges over 31 days must not issue a request.
- Changing a valid range must reset pagination and issue one query with formatted dates.
- Query failures must expose a retry action without hiding the date filter.

---

### Task 1: API contract and locale contract

**Files:**
- Modify: `src/types/exitCandidate.ts`
- Modify: `src/api/exitCandidates.ts`
- Modify: `src/api/exitCandidates.test.ts`
- Create: `src/locales/cancelledExitHistory.test.ts`
- Modify: `src/locales/{uz-latn,uz-cyrl,ru,en}/translation.json`

**Interfaces:**
- Produces: `getCancelledExitCandidates(params)` and cancelled-history response types.
- Produces: `sessions.cancelledExit*` translation keys used by Tasks 2 and 3.

- [ ] Write failing API and four-locale contract tests.
- [ ] Run the focused tests and verify failures are caused by the missing API and keys.
- [ ] Add the exact backend types, GET request, and four-language strings.
- [ ] Run the focused tests and verify they pass.

### Task 2: Cancelled exit history tab

**Files:**
- Create: `src/pages/operator/SessionsPage/CancelledExitHistoryTab.tsx`
- Create: `src/pages/operator/SessionsPage/CancelledExitHistoryTab.test.tsx`

**Interfaces:**
- Consumes: `getCancelledExitCandidates(params)` and `sessions.cancelledExit*` keys from Task 1.
- Produces: default export `CancelledExitHistoryTab` for SessionsPage.

- [ ] Write failing tests for data, null fallbacks, image preview/no-image, loading, empty, error/retry, valid range changes, and rejected ranges over 31 days.
- [ ] Run the focused test and verify it fails because the component is missing.
- [ ] Implement the tab with today as the default range, inclusive 31-day validation, pagination, Alert retry, Empty, and AuthenticatedImage.
- [ ] Run the focused test and verify it passes.

### Task 3: Sessions integration and emergency-history removal

**Files:**
- Modify: `src/pages/operator/SessionsPage/index.tsx`
- Modify: `src/pages/operator/SessionsPage/index.test.tsx`
- Modify: `src/pages/operator/SessionsPage/ForcedOpenHistoryTab.tsx`
- Modify: `src/pages/operator/SessionsPage/ForcedOpenHistoryTab.test.tsx`
- Modify: `src/types/forcedOpenHistory.ts`
- Delete: `src/pages/operator/SessionsPage/EmergencyExitHistoryTab.tsx`
- Delete: `src/pages/operator/SessionsPage/EmergencyExitHistoryTab.test.tsx`
- Delete: `src/api/emergencyExitHistory.ts`
- Delete: `src/api/emergencyExitHistory.test.ts`
- Delete: `src/types/emergencyExitHistory.ts`
- Delete: `src/locales/emergencyExitHistory.test.ts`

**Interfaces:**
- Consumes: `CancelledExitHistoryTab` and its tab label from Tasks 1 and 2.
- Preserves: existing Forced Open visibility and all EmergencyBarrier code.

- [ ] Update tests first to require the new tab for every non-registrator role, exclude registrator, reject the removed emergency tab, and reject the removed forced-open emergency column.
- [ ] Run focused tests and verify expected failures.
- [ ] Integrate the new tab, remove the named emergency history surfaces, remove the forced-open emergency column, and delete only now-unused session translations.
- [ ] Run focused tests and verify they pass.

### Task 4: Verification and audit report evidence

**Files:**
- Verify all changed files and repository tests.

- [ ] Run all focused tests.
- [ ] Run the full frontend test suite.
- [ ] Run lint and build/typecheck.
- [ ] Inspect `git diff --check`, `git diff --stat`, and the final emergency-use inventory.
- [ ] Request a fresh whole-change review, fix important findings through RED-GREEN, and rerun affected verification.
