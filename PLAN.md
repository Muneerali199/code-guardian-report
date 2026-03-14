# Code Guardian — 10x Improvement Plan

> **Goal:** Transform Code Guardian from a working prototype into a production-grade, industry-leading security analysis platform.
>
> **Current version:** 15.0.0  
> **Plan created:** March 2026

---

## Overview

This document tracks every planned improvement, bug fix, and new feature across three phases. Work through phases in order — Phase 1 fixes broken fundamentals, Phase 2 completes half-built features, Phase 3 adds differentiation that puts Code Guardian ahead of competitors.

---

## Phase 1 — Fix What Is Broken (Week 1–2)

These are bugs that actively produce **wrong results or broken UX** for every user right now. Must be done before any new features.

### 1.1 Language Detection Bug — Wrong Rules for Go/Rust/Kotlin/Swift
**File:** `src/services/analysis/SecurityAnalyzer.ts:390`  
**Impact:** ~30% of repos analyzed with completely wrong security rules (JavaScript rules applied to Go, Rust, etc.)

**Root cause:**  
- `SupportedLanguage` type includes `"golang"` but detection returns `"go"`
- The switch at line 395 passes `"go"` through as-is, but `SECURITY_RULES["go"]` is `undefined`
- Engine silently falls back to `SECURITY_RULES.javascript` for all Go, Rust, Kotlin, Swift files

**Fix:** Map `"go"` → `"golang"`, add `"rust"`, `"kotlin"`, `"swift"` mappings in both the detection path and the extension-based fallback.

- [x] Fixed in this session ✓

---

### 1.2 Line Number Accuracy — All Duplicates Reported at Line 1
**File:** `src/services/analysis/SecurityAnalyzer.ts:1082`  
**Impact:** Every report with multiple matches of the same pattern shows wrong line numbers, making it impossible to navigate to actual issues.

**Root cause:**  
- `content.match(rule.pattern)` without `g` flag returns only the first match
- `content.indexOf(match)` always finds the **first** occurrence, not the current iteration
- Result: second, third, fourth occurrences all report the line of the first occurrence

**Fix:** Use `String.prototype.matchAll()` with a global regex and track actual match indices via `match.index` to calculate correct line numbers.

- [x] Fixed in this session ✓

---

### 1.3 Duplicate Issues — Same Vulnerability Shown 2–4x Per File
**File:** `src/services/enhancedAnalysisEngine.ts:183-199`  
**Impact:** Inflated issue counts, noise in results, users lose trust in the tool.

**Root cause:**  
4 analysis passes (pattern-based, AST, data-flow, modern scanning) all push to the same `allIssues` array with no deduplication. A single `eval()` call appears 3–4 times in results.

**Fix:** After all passes, deduplicate on `(filename, line, column, type/ruleId)`, keeping the highest-confidence occurrence.

- [x] Fixed in this session ✓

---

### 1.4 Version String Inconsistency
**Files:** `src/config/constants.ts:5`, `next.config.ts:175`, `src/components/pages/about/HowItWorksSection.tsx:312`  
**Impact:** App shows `"9.0.0"`, `"11.0.0"`, or `"2.0.0"` in three different places while package.json says `15.0.0`.

**Fix:** All three locations should use either `APP_VERSION` from `src/utils/version.ts` or `process.env.npm_package_version`.

- [x] Fixed in this session ✓

---

### 1.5 CSP Headers — Security Tool With Insecure Headers
**File:** `next.config.ts:223`  
**Impact:** `unsafe-inline` and `unsafe-eval` in a security analysis tool is embarrassing and weakens XSS protection.

**Fix:** Remove `'unsafe-inline'` from `script-src` by using nonce-based CSP or hashes. Remove `'unsafe-eval'` by identifying and replacing any `eval()` usage in dependencies.

- [x] Fixed in this session ✓

---

## Phase 2 — Complete Half-Built Features (Week 3–6)

Features that exist in the UI but are not fully wired up or have silent failures.

### 2.1 Create Pull Request to Fix Bugs — **NEW FLAGSHIP FEATURE**
**Priority:** High  
**ETA:** Week 3–4

When a user analyzes a GitHub repository by URL and receives the full security report, they can click **"Create Fix PR"** to automatically:

1. **Fork the repository** (or use an existing fork) via GitHub API
2. **Apply AI-generated patches** for each fixable issue (e.g., replace `eval()` with `JSON.parse()`, add parameterized queries, remove hardcoded secrets)
3. **Create a new branch** `code-guardian/auto-fix-{timestamp}` on the fork
4. **Commit the changes** with descriptive commit messages per fix
5. **Open a Pull Request** back to the original repository with:
   - A full summary of all fixed vulnerabilities (severity, CWE, line numbers)
   - Before/after code diffs for each fix
   - OWASP categories addressed
   - Link back to the full Code Guardian report
6. **Show PR URL** to the user so they can review and merge

**Implementation plan:**
- [ ] New API route: `POST /api/github/create-fix-pr`
  - Accepts: `repoUrl`, `fixes[]` (array of {filename, line, patch, issueId}), `githubToken`
  - Uses GitHub REST API: fork → create branch → create/update file blobs → create PR
- [ ] New service: `src/services/github/AutoFixService.ts`
  - `generatePatch(issue: SecurityIssue): CodePatch | null` — AI-powered fix generation per rule type
  - `applyPatches(files, patches): PatchResult[]` — apply patches to file contents
  - `createFixBranch(repo, token): string` — create branch via GitHub API
  - `commitPatches(repo, branch, patches, token): void` — commit file changes
  - `openPullRequest(repo, branch, report, token): PRResult` — create PR with full report
- [ ] New component: `src/components/github/CreateFixPRButton.tsx`
  - Shows in the results view when analysis source is a GitHub URL
  - Step-by-step progress indicator (Forking... Applying fixes... Creating PR...)
  - Preview of all patches before submission
  - Token permission check (needs `repo` scope)
- [ ] Patch generators for top fix types:
  - `eval()` → `JSON.parse()` / safe equivalent
  - `innerHTML` → `textContent` / DOMPurify sanitize
  - `Math.random()` → `crypto.getRandomValues()`
  - Hardcoded credentials → environment variable placeholder + `.env.example` entry
  - Missing `helmet` / security middleware → add to Express setup
  - SQL string concatenation → parameterized query template
- [ ] PR template with Code Guardian branding and full vulnerability report

**Acceptance criteria:**
- User can click "Create Fix PR" after any GitHub URL analysis
- PR is created on GitHub with all auto-fixable issues patched
- Non-auto-fixable issues are listed in the PR description as manual tasks
- User sees the PR URL and can click through to GitHub

---

### 2.2 Fix Custom Rules Engine (Firebase-Free Fallback)
**File:** `src/services/rules/CustomRulesEngine.ts`  
**Priority:** High

Custom rules silently fail for all users without Firebase config. Add `localStorage` fallback so the feature works without Firebase.

- [ ] Add `isFirebaseConfigured()` guard
- [ ] Implement `localStorage`-based rule store as fallback
- [ ] Show clear error when Firebase is unavailable instead of silent failure
- [ ] Add rule import/export as JSON file

---

### 2.3 Fix AST Rule Stub
**File:** `src/services/rules/CustomRulesEngine.ts:453`  
**Priority:** High

The `ast` rule type handler is an empty stub. It does nothing. Implement basic AST pattern matching using the existing `@babel/parser` and `acorn` dependencies already in package.json.

- [ ] Implement `executeASTRule(rule, content)` using acorn/babel parser
- [ ] Support node type matching (e.g., "CallExpression where callee.name === 'eval'")
- [ ] Add UI for building AST rules in `CustomRulesEditor`

---

### 2.4 Logger Stubs — Production Errors Silently Dropped
**File:** `src/utils/logger.ts:144`  
**Priority:** High

`sendToErrorTracking()` and `flush()` are empty. Errors are logged to console and then vanish.

- [ ] Implement `sendToErrorTracking()` using a real service (Sentry, LogRocket, or a custom `/api/log-error` endpoint that already exists)
- [ ] Connect the existing `/api/log-error` route to the logger
- [ ] Add error batching and `flush()` on page unload

---

### 2.5 SARIF Export
**Priority:** High  
**Why:** SARIF is the industry standard format for security tools. GitHub Code Scanning, VS Code, and most CI tools consume SARIF natively. Adding this opens integration with the entire DevSecOps ecosystem.

- [ ] Implement `exportAsSARIF(results)` in `src/services/export/sarifExporter.ts`
- [ ] Follow SARIF 2.1.0 spec (OASIS standard)
- [ ] Add SARIF button to `DataExport.tsx`
- [ ] Include: runs, results, rules, locations, code flows, fixes
- [ ] Test output loads correctly in GitHub Code Scanning upload

---

### 2.6 Fix Dependency Scanner Metadata
**File:** `src/services/security/dependencyVulnerabilityScanner.ts`  
**Priority:** Medium

`scanMetadata.databasesUsed` falsely claims `["NVD", "GitHub Advisory", "OSV"]` but only OSV.dev is queried.

- [ ] Update to `["OSV.dev"]` to reflect reality
- [ ] OR add real GitHub Advisory API calls to justify the claim
- [ ] Add GitHub Advisory API: `POST https://api.github.com/graphql` with Advisory query

---

### 2.7 Fix In-Memory Cache for GitHub Downloads
**File:** `app/api/github/download/route.ts`  
**Priority:** Medium

In-memory cache never persists in serverless deployments — every request is a cache miss.

- [ ] Replace in-memory `Map` with Redis (Upstash) or Vercel KV
- [ ] Add `UPSTASH_REDIS_REST_URL` env var support
- [ ] Fall back gracefully to no cache if Redis not configured

---

### 2.8 Add Rate Limiting to API Routes
**Priority:** Medium

No rate limiting on any API route. A single user can hammer the GitHub/Copilot APIs.

- [ ] Add `@upstash/ratelimit` middleware to:
  - `/api/github/download` — 10 req/min per IP
  - `/api/copilot` — 20 req/min per user
  - `/api/push` — 100 req/min per user
- [ ] Return `429 Too Many Requests` with `Retry-After` header

---

## Phase 3 — New Differentiating Features (Week 7–12)

Features that no free competitor has, making Code Guardian the best in its class.

### 3.1 GitHub Action / CI Integration
**Priority:** High

Allow Code Guardian to run as a GitHub Action in any CI pipeline.

- [ ] Create `action.yml` in a new `github-action/` directory
- [ ] Publish to GitHub Marketplace as `code-guardian/scan`
- [ ] Outputs: SARIF file, JSON report, PR comment with summary
- [ ] Fail CI on critical vulnerabilities (configurable threshold)
- [ ] Example workflow:
```yaml
- uses: code-guardian/scan@v1
  with:
    fail-on: critical
    output: sarif
```

---

### 3.2 VS Code Extension
**Priority:** High

Meet developers in their editor. Show inline security warnings as they type.

- [ ] New repo: `code-guardian-vscode`
- [ ] Real-time analysis on file save
- [ ] Inline decorations for issues (red squiggles + hover details)
- [ ] Quick-fix suggestions via VS Code's Code Actions API
- [ ] Sync with web report (same account, same history)

---

### 3.3 Organization-Level Scanning
**Priority:** High

Scan all repositories in a GitHub organization and show a unified dashboard.

- [ ] GitHub App installation (org-wide, not per-repo token)
- [ ] Bulk scan: queue all repos, show progress
- [ ] Org dashboard: risk score per repo, trending issues, worst offenders
- [ ] Filter by language, team, severity

---

### 3.4 Compliance Mapping (OWASP, CWE, NIST)
**Priority:** Medium

Map every finding to compliance frameworks.

- [ ] OWASP Top 10 2021 coverage report
- [ ] CWE Top 25 mapping
- [ ] NIST 800-53 control mapping
- [ ] Export compliance report as PDF
- [ ] Show "X% OWASP Top 10 coverage" badge

---

### 3.5 Git History Secret Scanning
**Priority:** Medium

Scan the entire git commit history for secrets, not just current code. Leaked secrets in old commits are just as dangerous.

- [ ] Use GitHub API to fetch commit history + diffs
- [ ] Run secret detection on each diff
- [ ] Report: "Secret found in commit abc123 by user@email.com on 2024-01-15"
- [ ] Recommend using `git-filter-repo` to purge

---

### 3.6 IaC and Dockerfile Scanning
**Priority:** Medium

Most repos now have Terraform, Kubernetes YAML, or Dockerfiles.

- [ ] Detect IaC files: `*.tf`, `*.yaml` (K8s), `Dockerfile`, `docker-compose.yml`
- [ ] Add IaC-specific rules:
  - Terraform: public S3 buckets, unrestricted security groups, no encryption
  - Kubernetes: privileged containers, missing resource limits, hostPath mounts
  - Docker: running as root, `ADD` instead of `COPY`, outdated base images
- [ ] New section in results: "Infrastructure Security"

---

### 3.7 Trend Tracking and Historical Comparison
**Priority:** Medium

Show how security posture changes over time.

- [ ] Store analysis results in Firebase/DB per repo per date
- [ ] Show trend chart: "Issues found over last 30 days"
- [ ] Compare two scans: "Since last week: 3 new critical, 5 fixed"
- [ ] Email digest: weekly security summary per repo

---

### 3.8 Baseline / Suppression File
**Priority:** Low

Allow teams to suppress known false positives so they don't reappear.

- [ ] `.codeguardian.json` baseline file in repo root
- [ ] UI to mark an issue as "accepted risk" or "false positive"
- [ ] Suppressed issues shown greyed out, not counted in score
- [ ] Require a justification comment for each suppression

---

### 3.9 License Compliance Scanning
**Priority:** Low

Flag GPL/AGPL/SSPL dependencies in commercial projects.

- [ ] Parse `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`
- [ ] Check each dependency license via `https://registry.npmjs.org/<pkg>`
- [ ] Flag: GPL, AGPL, SSPL, BUSL as risky for commercial use
- [ ] Export license inventory as CSV

---

## Technical Debt Backlog

These are not user-facing features but essential for long-term maintainability.

| Item | Priority | Notes |
|------|----------|-------|
| Add unit tests for `SecurityAnalyzer.ts` | High | Zero tests currently exist |
| Add unit tests for `EnhancedAnalysisEngine.ts` | High | Most critical path |
| Add integration tests for all API routes | High | |
| Set up GitHub Actions CI pipeline | High | `.github/workflows/ci.yml` |
| Replace `commitsData.ts` with live GitHub API | Medium | 9,585-line static file |
| Add Storybook for component library | Medium | 110+ components, no visual tests |
| Enable TypeScript strict mode | Medium | `"strict": true` in tsconfig |
| Add OpenTelemetry traces | Low | Observability |
| Add Sentry error monitoring | Low | Connect to existing logger stubs |
| Audit and fix all `any` types | Low | After strict mode |

---

## Progress Tracker

| Phase | Total Items | Done | In Progress | Remaining |
|-------|------------|------|-------------|-----------|
| Phase 1 — Fix Broken | 5 | 5 | 0 | 0 |
| Phase 2 — Complete Features | 8 | 0 | 0 | 8 |
| Phase 3 — New Features | 9 | 0 | 0 | 9 |
| Tech Debt | 10 | 0 | 0 | 10 |

---

## Architecture Notes for Phase 2.1 (Auto-Fix PR)

```
User clicks "Create Fix PR"
        │
        ▼
CreateFixPRButton.tsx
  → Calls POST /api/github/create-fix-pr
        │
        ▼
AutoFixService.ts
  1. generatePatch(issue) per fixable issue
  2. GitHub API: POST /repos/{owner}/{repo}/forks  (fork repo)
  3. GitHub API: GET /repos/{fork}/git/refs/heads/{default}
  4. GitHub API: POST /repos/{fork}/git/refs  (create branch)
  5. For each patched file:
     a. GET /repos/{fork}/contents/{path}  (get current SHA)
     b. PUT /repos/{fork}/contents/{path}  (update file)
  6. GitHub API: POST /repos/{owner}/{repo}/pulls  (open PR)
  7. Return PR URL
        │
        ▼
UI shows PR URL + success state
```

### Patch Generation Strategy

Not all issues are auto-fixable. The service categorises each:

| Issue Type | Auto-Fixable | Fix Strategy |
|-----------|-------------|--------------|
| `eval()` usage | Yes | Replace with `JSON.parse()` or `Function()` with sandbox |
| `innerHTML` XSS | Yes | Replace with `textContent` or add DOMPurify |
| `Math.random()` crypto | Yes | Replace with `crypto.getRandomValues()` |
| Hardcoded API key | Yes | Replace with `process.env.VAR_NAME`, add to `.env.example` |
| SQL concatenation | Partial | Add comment + parameterized query template |
| Missing HTTPS | Yes | Replace `http://` with `https://` |
| `console.log` secrets | Yes | Remove the line |
| Complex logic flaws | No | Listed in PR description as manual tasks |

---

*Last updated: March 2026 | Maintained by the Code Guardian Team*
