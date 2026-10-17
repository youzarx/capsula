# Architecture Notes — Phase 1: Stabilization & Security

**Project:** Capsula (Fork evolution of `capsule-render`)  
**Phase:** 1 — Stabilization & Security  
**Date:** 2026-10-16  
**Status:** COMPLETED

---

## 1. Architectural Scope & Objectives

The primary focus of Phase 1 was strictly stabilization, correctness, XML/SVG security hardening, and regression testing. No new visual features, themes, or rebranding changes were introduced.

### Target Areas
1. **API Parameter Resolution (`api/index.ts`)**:
   - Single-point type resolution with consistent fallback to `"wave"`.
   - Handling of missing, empty, or array query parameters.
   - Distinct HTTP status codes: 400 for client validation errors, 500 for internal errors.
   - Sanitized error output preventing internal exception/stack trace leaks.
2. **Model Lifecycle & Wave Determinism (`model/normalModel/wave.ts`)**:
   - Removal of in-place mutation on instance state (`this.height`).
   - Pure, deterministic coordinate computation across repeated renders.
3. **SVG/XML Security Boundary (`utils/html.ts`, `utils/render.ts`)**:
   - Standard XML entity escaping (`&`, `<`, `>`, `"`, `'`) for all text and subtitle nodes.
   - Protection against double-escaping pre-encoded XML entities.
   - Prevention of XML markup injection and script execution in embedded SVGs.
4. **Input Boundary Enforcement (`src/verification.ts`, `model/model.ts`)**:
   - Strict validation and bounded ranges for numeric parameters (height, fontSize, descSize, strokeWidth, rotate, alignments).
   - Strict sanitization of CSS font-family strings to prevent `<style>` tag breakout.
   - Hex code format enforcement and custom gradient stop validation.

---

## 2. Core Architectural Changes

### 2.1 API Request Handler (`api/index.ts`)

#### Prior Flaw
Previously, `api/index.ts` read `req.query.type || "wave"` into a local variable `type`, validated `Models[regexData(type)]`, but then instantiated `Models[regexData(req.query.type)]`. If `type` was omitted from `req.query`, `req.query.type` was `undefined`, causing `regexData(undefined)` to evaluate to `"undefined"`, resulting in `TypeError: Models[...] is not a constructor`.

#### Solution
- `rawType` is extracted defensively, handling array values (`req.query.type[0]`) or scalar strings.
- If absent, null, or empty, it defaults cleanly to `"wave"`.
- If provided, it is sanitized via `regexData(rawType)`.
- If the normalized type does not match any registered model, an error with `statusCode = 400` is raised.
- When valid, the resolved type is forwarded into `query` and used to index `Models[type]`.
- Error handler checks for explicit `statusCode` (defaulting to 400 for validation errors, 500 for unexpected errors), ensures `res.status(status)` is called if supported, and returns an inert message without exposing stack traces.

### 2.2 Wave Model Path Generation (`model/normalModel/wave.ts`)

#### Prior Flaw
`Wave.prototype.path()` directly decremented instance property `this.height -= 120`. Consequently, each invocation of `path()` or `render()` permanently diminished `this.height` by 120. Calling `render()` multiple times resulted in decaying curve coordinates.

#### Solution
- Implemented `const baseHeight = this.height - 120;` as a local, pure variable.
- Preserved the benchmark offset without mutating instance state.
- Path calculation is now idempotent: $f(state) \rightarrow path$ without side effects.

### 2.3 XML Escaping & Text Rendering (`utils/html.ts`, `utils/render.ts`)

#### Prior Flaw
User-supplied `text` and `desc` strings were interpolated directly into `<text>` and `<tspan>` tags:
```xml
<text ...>${lines[0]}</text>
```
If `text` contained XML characters (e.g., `<script>alert(1)</script>` or `Tom & Jerry`), it either broke XML well-formedness or injected active elements.

#### Solution
- Exported `escapeXml(unsafe: string): string` from `utils/html.ts`:
  ```typescript
  export const escapeXml = (unsafe: string): string => {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };
  ```
- The negative lookahead `(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)` ensures pre-existing entities (such as `&amp;` or `&#39;`) are preserved and not double-escaped.
- Applied `escapeXml` to every line emitted inside `getText` and `getDesc`.
- Unicode characters (Arabic, emojis, accented characters) remain untouched and valid in UTF-8 SVG documents.

### 2.4 Parameter Validation and Bounding (`src/verification.ts`, `model/model.ts`)

#### Validation Specifications
| Parameter | Type / Format | Allowed Bounds / Rule | Default |
| :--- | :--- | :--- | :--- |
| `type` | String | Must exist in `Models` registry | `"wave"` |
| `height` | Integer | $1 \le h \le 2000$ | `120` |
| `fontSize` | Integer | $1 \le fs \le 500$ | `70` |
| `descSize` | Integer | $1 \le ds \le 300$ | `20` |
| `strokeWidth` | Integer | $0 \le sw \le 100$ | `0` or `1` |
| `rotate` | Float | $-360 \le r \le 360$ | `0` |
| `descAlign` | Float | $-100 \le da \le 200$ | `50` |
| `descAlignY` | Float | $-100 \le day \le 200$ | `60` |
| `fontAlign` | Float Array | Each value $-100 \le fa_i \le 200$ | `[50]` |
| `fontAlignY` | Float Array | Each value $-100 \le fay_i \le 200$ | `[50]` |
| `text` | String | Max 1000 characters | `""` |
| `desc` | String | Max 1000 characters | `""` |
| `stroke` | Hex / `"none"` | Must match `/^#?[0-9a-fA-F]{3,8}$/` or `"none"` | `"none"` or `"B897FF"` |
| `fontColor` | Hex | Must match `/^#?[0-9a-fA-F]{3,8}$/` | Palette/Auto |
| `descColor` | Hex | Must match `/^#?[0-9a-fA-F]{3,8}$/` | Font color |
| `textBgColor` | Hex | Must match `/^#?[0-9a-fA-F]{3,8}$/` | `"000000"` |
| `fontFamily` | String | Must match `/^[a-zA-Z0-9\s,._\-'"@]+$/`, no `<, >, {, }, ;, \\` | System stack |
| `section` | Enum | `"header" \| "footer"` | `"header"` |
| `animation` | Enum | Must be in `ANIMATION_NAMES` | `"fadeIn"` |
| `theme` | Enum | Must exist in `pallete_theme.json` or `"none"` | `"none"` |
| `customColorList`| Comma list | Digits only (`/^(\d+)(,\d+)*$/`) | `""` |

---

## 3. Threat Modeling & Security Posture

### Addressed Threats
1. **Cross-Site Scripting (XSS) via SVG Injection**:
   - Hostile SVG text containing `<script>`, `<foreignObject>`, or closing `</text>` tags is sanitized into inert character data.
   - Verified via `xmldom` parsing in unit tests: `doc.getElementsByTagName("script").length === 0`.
2. **CSS Style Tag Breakout**:
   - Untrusted `fontFamily` strings cannot inject closing `</style>` tags or rogue CSS blocks.
3. **Denial of Service (DoS) via Extreme Allocation**:
   - Bounded dimensions prevent canvas memory exhaustion.
   - Text length caps (1000 chars) prevent quadratic parsing costs.
4. **Information Disclosure**:
   - Handled exceptions return clean status codes and user-safe error messages. Internal errors return generic `Internal Server Error` without stack traces.

### Residual Risks & Future Phases
- **HTTP Caching**: API headers currently lack `Cache-Control: public, max-age=...` or `no-cache` for time-based models. This will be addressed in deployment configuration.
- **Client-side Preview Sandbox**: When integrating live browser rendering in Phase 2, the SVG will be rendered in a scoped container or `<img>` element to ensure complete isolation.
