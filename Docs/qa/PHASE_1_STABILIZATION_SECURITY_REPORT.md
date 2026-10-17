# QA Report — Phase 1: Stabilization & Security

**Project:** Capsula  
**Reviewer:** Senior TypeScript Engineer & Security Reviewer  
**Date:** 2026-10-16  
**Final Status:** **PASS**

---

## 1. Initial Workspace and Git-Status Findings

- **Workspace Path:** `C:\Users\Youssef HANIN\Desktop\Capsula`
- **Project Root:** `C:\Users\Youssef HANIN\Desktop\Capsula\capsule-render-main`
- **Git Repository Status:**
  - `git status` executed in workspace root (`C:\Users\Youssef HANIN\Desktop\Capsula`) returned exit code 1:
    `fatal: not a git repository (or any of the parent directories): .git`
  - `git status` executed in `capsule-render-main` returned exit code 1:
    `fatal: not a git repository (or any of the parent directories): .git`
  - *Conclusion:* The downloaded ZIP archive contains no `.git` directory and no Git history. No remote Git tracking exists.
- **Package Manager:** `npm` (confirmed via `package-lock.json` lockfileVersion 3).
- **Initial Dependency Status:** `node_modules` was initially absent. Installed cleanly via `npm ci`.

---

## 2. Baseline Test & Build Results

Before applying any source code modifications:
1. `npm test` baseline:
   - Command: `npm test`
   - Exit code: 0
   - Test Suites: 5 passed, 5 total (`data.test.ts`, `color.test.ts`, `api.test.ts`, `content.test.ts`, `model.test.ts`)
   - Tests: 115 passed, 115 total
   - Snapshots: 16 passed, 16 total
2. `npm run typecheck` baseline:
   - Command: `tsc --project tsconfig.app.json`
   - Exit code: 0 (clean, no TypeScript diagnostics)

---

## 3. Files Changed and Why

| File | Change Summary & Rationale |
| :--- | :--- |
| `api/index.ts` | • Resolved requested `type` once defensively.<br>• Defaulted absent/empty `type` cleanly to `"wave"`.<br>• Handled array query inputs (`req.query.type[0]`).<br>• Added proper HTTP status handling (400 for input errors, 500 for unexpected errors).<br>• Prevented internal error stack traces from leaking to callers. |
| `model/normalModel/wave.ts` | • Replaced instance mutation `this.height -= 120` with local pure variable `const baseHeight = this.height - 120;`.<br>• Ensured wave path coordinate generation is deterministic and idempotent across repeated calls. |
| `utils/html.ts` | • Implemented and exported `escapeXml` handling XML entities (`&`, `<`, `>`, `"`, `'`).<br>• Included lookahead protection to prevent double-escaping already-encoded entities (`&amp;`, `&#39;`). |
| `utils/render.ts` | • Imported `escapeXml` and applied it to every text and description line rendered inside SVG `<text>` and `<tspan>` tags. |
| `src/verification.ts` | • Added validation helpers for bounded numbers, numeric arrays, string lengths, hex colors, and font-family strings.<br>• Hardened `checkCustomColor` against malformed stops and non-hex inputs. |
| `model/model.ts` | • Applied validation and bounding across all constructor parameters (`height`, `fontSize`, `descSize`, `strokeWidth`, `rotate`, `descAlign`, `descAlignY`, `fontAlign`, `fontAlignY`, `text`, `desc`, `stroke`, `fontColor`, `descColor`, `textBgColor`, `fontFamily`, `animation`, `section`, `theme`, `customColorList`).<br>• Hardened against CSS and SVG attribute breakout. |
| `__test__/api.test.ts` | • Added regression tests for omitted type, array query type, 400 status on invalid type, and 400 status on malformed parameters. |
| `__test__/security.test.ts` | • Added comprehensive security and regression test suite covering Wave determinism, hostile XML/script injection, Tom & Jerry entity handling, Arabic/emoji Unicode support, and parameter boundary rejection. |

---

## 4. Security Issues Addressed and Remaining Risks

### Issues Addressed
1. **SVG Script Injection / XSS**:
   Hostile input containing `<script>alert(1)</script>` or `</text><script>` is escaped to `&lt;script&gt;alert(1)&lt;/script&gt;`. Tests confirm `doc.getElementsByTagName("script").length === 0` and the text parses as literal text data.
2. **Double-Escaping Bug**:
   Strings with existing entities (e.g. `Tom &amp; Jerry` or `&#39;`) are preserved without transforming into `&amp;amp;`.
3. **CSS / Style Tag Breakout**:
   `fontFamily` is validated against `/^[a-zA-Z0-9\s,._\-'"@]+$/` and forbidden from containing `<, >, {, }, ;, \\, /*, */`.
4. **SVG Attribute Escaping**:
   Color and stroke parameters must be valid hex values or recognized keywords (`none`, `auto`, etc.), preventing attribute breakout via quotes.
5. **Denial of Service via Pathological Dimensions**:
   Dimension parameters are strictly bounded (e.g., $1 \le \text{height} \le 2000$). Extreme/infinite values return HTTP 400.
6. **Information Leakage**:
   Stack traces and internal details are replaced by standardized client error messages.

### Remaining Risks & Out-of-Scope Items
- **CDN Caching**: `Cache-Control` header optimization for GitHub Camo CDN remains for the deployment phase.
- **Client-Side Live Preview Isolation**: In Phase 2, sandbox containment for live client previews will be implemented.

---

## 5. Exact Commands Executed and Real Exit Statuses

| # | Command | Directory | Purpose | Exit Code | Result |
| :- | :--- | :--- | :--- | :-: | :--- |
| 1 | `git status` | Workspace root | Check Git history | 1 | No `.git` found |
| 2 | `git status` | `capsule-render-main` | Check Git history | 1 | No `.git` found |
| 3 | `npm ci` | `capsule-render-main` | Install baseline dependencies | 0 | 858 packages installed |
| 4 | `npm test` | `capsule-render-main` | Baseline test run | 0 | 5 suites, 115 tests passed |
| 5 | `npm run typecheck` | `capsule-render-main` | Baseline TypeScript check | 0 | App tsconfig passed |
| 6 | `npm test` | `capsule-render-main` | Verification after core fixes | 0 | 5 suites, 115 tests, 16 snaps passed |
| 7 | `npm test` | `capsule-render-main` | Full suite with security tests | 0 | 6 suites, 131 tests, 16 snaps passed |
| 8 | `npm run typecheck` | `capsule-render-main` | TypeScript check with new code | 0 | Passed with 0 errors |
| 9 | `npm run build` | `capsule-render-main` | Production build verification | 0 | Built in 3.28s |

---

## 6. Test Coverage Added

### New Test Cases in `__test__/api.test.ts`
1. `handles request when type is completely omitted, defaulting to wave`
2. `handles query.type as an array of values safely`
3. `returns 400 status and error message on invalid type`
4. `returns 400 status on invalid numeric query parameter`

### New Test Cases in `__test__/security.test.ts`
1. `calling path() and render() repeatedly does not mutate this.height` (Wave determinism)
2. `safely escapes XML special characters in text and desc` (No `<script>` elements in XML DOM)
3. `correctly handles 'Tom & Jerry' and quoted strings without double escaping`
4. `preserves Arabic text, emojis, and multiline text`
5. `rejects negative, zero, and extreme height values`
6. `rejects extreme fontSize and descSize`
7. `rejects extreme rotate values outside [-360, 360]`
8. `rejects malformed fontAlign arrays and values`
9. `rejects excessively long text strings (>1000 chars)`
10. `rejects malicious or malformed fontFamily strings`
11. `rejects malicious or invalid colors, strokes, and gradients`
12. `rejects invalid section, animation, and theme values`

**Total Test Count:** 131 passing tests (16 new tests added), 0 failing.

---

## 7. Before / After Behavior for Key Bugs

### 7.1 API Default Type Bug (`api/index.ts`)
- **Before:** Requesting `/api` with no query parameters evaluated `req.query.type` as `undefined`. Line 11 executed `new Models[regexData(req.query.type)](req.query)`, resolving to `Models["undefined"]`, throwing `TypeError: Models[...] is not a constructor`.
- **After:** `api/index.ts` determines if `type` was explicitly provided. If absent, it resolves directly to `"wave"`. `new Models["wave"]({ ...query, type: "wave" })` is instantiated, returning valid SVG.

### 7.2 Wave Height Mutation Bug (`model/normalModel/wave.ts`)
- **Before:** `this.height -= 120` was executed on each `path()` call. On first render: `height = 180`. On second render: `height = 60`. On third render: `height = -60`. Coordinates degraded continuously.
- **After:** `const baseHeight = this.height - 120;` is computed as a local variable. `this.height` remains untouched. Coordinates and snapshots are identical whether rendered once or 100 times.

---

## 8. Known Limitations or Blocked Checks

- Root `tsconfig.json` targets CommonJS (`"module": "commonjs"`), whereas `vite.config.ts` requires Bundler resolution. Running `npx tsc --noEmit -p tsconfig.json` reports a module resolution notice on `vite.config.ts`. The repository’s official typecheck script (`npm run typecheck` which runs `tsc --project tsconfig.app.json`) passes with 0 errors.

---

## 9. Deployment, Push, and Commit Confirmation

- **Git Commits Created:** 0 (none)
- **Git Push Executed:** None
- **Deployments / Releases Published:** None
- All operations were strictly local to the workspace directory.

---

## Final Status

**PASS**
