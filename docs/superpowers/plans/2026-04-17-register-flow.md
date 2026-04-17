# Register Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add end-to-end self-registration for PASSENGER/DRIVER with auto-login session return.

**Architecture:** Add `/auth/register` in auth-service as the public registration entry. Auth-service calls a new internal user-service registration endpoint, then issues JWT and returns the same payload shape as login. Frontend LandingPage adds real register form and uses returned session to navigate immediately.

**Tech Stack:** Spring Boot, OpenFeign, JUnit 5, React + TypeScript + Vitest

---

## Chunk 1: Backend contract and validation

### Task 1: Add failing auth registration service tests

**Files:**
- Modify: `auth-service/src/test/java/com/o2o/hitch/auth/service/AuthServiceTest.java`

- [ ] **Step 1: Write failing tests** for `register` success and invalid role.
- [ ] **Step 2: Run tests to verify failure**
  Run: `mvn -pl auth-service -Dtest=AuthServiceTest test`
- [ ] **Step 3: Implement minimal auth register code** in service/client/dto/controller.
- [ ] **Step 4: Re-run tests to green**
- [ ] **Step 5: Commit backend auth chunk**

### Task 2: Add failing user registration constraints tests

**Files:**
- Modify: `user-service/src/test/java/com/o2o/hitch/user/service/UserServiceTest.java`
- Modify: `user-service/src/main/java/com/o2o/hitch/user/service/UserService.java`
- Modify: `user-service/src/main/java/com/o2o/hitch/user/controller/UserController.java`

- [ ] **Step 1: Write failing tests** for duplicate user and invalid role.
- [ ] **Step 2: Run tests to verify failure**
  Run: `mvn -pl user-service -Dtest=UserServiceTest test`
- [ ] **Step 3: Implement minimal validation + internal register endpoint**
- [ ] **Step 4: Re-run tests to green**
- [ ] **Step 5: Commit backend user chunk**

## Chunk 2: Frontend register and integration

### Task 3: Add failing frontend API/register tests

**Files:**
- Modify: `frontend/src/__tests__/api.spec.ts`
- Modify: `frontend/src/api/index.ts`

- [ ] **Step 1: Write failing API test** for `register` payload/path.
- [ ] **Step 2: Run test to verify failure**
  Run: `npm --prefix frontend test -- api.spec.ts`
- [ ] **Step 3: Implement `register` API method**
- [ ] **Step 4: Re-run test to green**
- [ ] **Step 5: Commit API chunk**

### Task 4: Add landing register UI and behavior

**Files:**
- Modify: `frontend/src/app/auth/LandingPage.tsx`
- Modify: `frontend/src/__tests__/routing.spec.tsx`

- [ ] **Step 1: Write failing UI test** for register area rendered.
- [ ] **Step 2: Run test to verify failure**
  Run: `npm --prefix frontend test -- routing.spec.tsx`
- [ ] **Step 3: Implement register form + submit + auto-login navigation**
- [ ] **Step 4: Re-run UI test to green**
- [ ] **Step 5: Commit frontend chunk**

## Chunk 3: Verification

### Task 5: End-to-end verification commands

**Files:**
- Modify (docs): `docs/kizy-修复流程记录.md`

- [ ] **Step 1: Run targeted backend tests**
  Run: `mvn -pl user-service,auth-service -am -DskipTests=false -Dtest=UserServiceTest,AuthServiceTest test`
- [ ] **Step 2: Run targeted frontend tests**
  Run: `npm --prefix frontend test -- api.spec.ts routing.spec.tsx app-session.spec.tsx`
- [ ] **Step 3: Update repair log doc with date and validation evidence**
- [ ] **Step 4: Summarize changed files + residual risks**

Plan complete and saved to `docs/superpowers/plans/2026-04-17-register-flow.md`. Ready to execute?
