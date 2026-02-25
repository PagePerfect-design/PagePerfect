# Plan: Debug LaTeX File Generation

## Root Cause Analysis

All three hypotheses are confirmed:

### 1. No `.tex` file is ever written to disk

Pandoc with `-o output.pdf` generates LaTeX **in memory** and pipes it to LuaLaTeX via an internal stdin pipe. It never writes an intermediate `.tex` file. The only files written to the worker temp dir (`/tmp/pp-worker-XXXXXX/`) before Pandoc runs are:

| File | Purpose |
|------|---------|
| `input.md` | Processed manuscript markdown |
| `template.latex` | Patched Pandoc template (copy of selected template with font substitutions) |
| `header.tex` | Assembled preamble (geometry, extensions, watermark, engineering policies) |

LuaLaTeX **does** create `.log` and `.aux` files during compilation, but...

### 2. The temp directory is destroyed immediately on failure

At `compile-worker.js:541-542`:
```javascript
if (!result.ok) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
```

This runs **before** the error response is even constructed. The `.log`, `.aux`, and any other LuaLaTeX output files exist briefly during compilation but are destroyed before anyone can inspect them.

### 3. The "Engine log" in the UI is truncated stderr, not a real log file

At `compile-worker.js:551`:
```javascript
detail: sanitizeStderr(stderr.split('\n').slice(-15).join('\n')),
```

Only the **last 15 lines** of stderr (with server paths stripped) are returned. The full LuaLaTeX log (often hundreds of lines with critical context) is discarded. This truncated string is sent to the frontend via the `detail` field, prefixed with `__detail__` in `useCompileQueue.ts`, and rendered in a collapsible "Engine log" `<details>` section in `PreviewPane.tsx`.

---

## The Fix

### Phase 1: Capture debug artifacts before temp dir cleanup (Backend)

**File:** `backend/compile-worker.js`

**Change A** — After `result.ok` check fails (line 541), before `fs.rmSync`, capture everything useful:

1. List all files in `tmpBase` (diagnostic — shows what compilation stage was reached)
2. Read any `.log` file (LuaLaTeX writes `input.log` or similar — try all `*.log` names)
3. Read `header.tex` (the assembled preamble — already on disk)
4. Generate the `.tex` source by re-running Pandoc with `-o output.tex` instead of `-o output.pdf` (fast — no LuaLaTeX, just template rendering, 10s timeout). This shows exactly what LaTeX Pandoc would have sent to the engine.
5. **Then** run `fs.rmSync` to clean up as before.

**Change B** — Increase stderr capture from 15 lines to 80 lines (line 551).

**Change C** — Include debug artifacts in the error return object:
```javascript
return {
  success: false, error: result.error || 'compile_failed',
  message: fallbackMessage, warnings,
  errors: structuredErrors,
  detail: sanitizeStderr(stderr.split('\n').slice(-80).join('\n')),
  debug: {
    texSource: <generated .tex content, capped at 100KB>,
    latexLog: <full .log file content, sanitized>,
    headerTex: <the preamble that was injected>,
    filesInDir: <string[] of filenames that existed>,
  },
};
```

### Phase 2: Pass debug data through the status endpoint (Backend)

**File:** `backend/routes/compile.js` (or `backend/index.js` — wherever job results are stored/returned)

The BullMQ job result is stored in memory and returned via `GET /api/compile/status/:jobId`. The `debug` field needs to flow through:
- Store it in the in-memory job result
- Return it in the status response
- Also handle the sync fallback path (direct `processCompileJob` call)

### Phase 3: Display debug artifacts in the frontend error panel

**File:** `frontend/src/app/app/PreviewPane.tsx`

Extend the existing "Engine log" `<details>` section to also show:
- **"Generated LaTeX"** — collapsible `<pre>` block showing the `.tex` source (if available)
- **"Full Engine Log"** — the complete `.log` file (if available), replacing the truncated stderr
- **"Compile Directory"** — list of files that existed (diagnostic)
- **"Preamble (header.tex)"** — the injected preamble

These go inside the existing error panel, as additional collapsible sections below the current "Engine log".

**File:** `frontend/src/app/app/useCompileQueue.ts`

Pass the `debug` field through from the status response to the error state.

**File:** `frontend/src/app/app/editor-types.ts`

Add a `CompileDebug` type:
```typescript
export type CompileDebug = {
  texSource?: string | null
  latexLog?: string | null
  headerTex?: string | null
  filesInDir?: string[] | null
} | null
```

---

## Specific Code Changes

### 1. `backend/compile-worker.js` — Lines 541-552

**Before (current):**
```javascript
if (!result.ok) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    const stderr = result.stderr || '';
    const { errors: structuredErrors, fallbackMessage } = errorTranslator.translateCompileFailure(
      stderr, { safeMode, errorCode: result.error }
    );
    return {
      success: false, error: result.error || 'compile_failed',
      message: fallbackMessage, warnings,
      errors: structuredErrors,
      detail: sanitizeStderr(stderr.split('\n').slice(-15).join('\n')),
    };
}
```

**After (new):**
```javascript
if (!result.ok) {
    // ── Capture debug artifacts before cleanup ──
    let debugTexSource = null;
    let debugLatexLog = null;
    let debugHeaderTex = null;
    let debugFiles = [];

    try {
      debugFiles = fs.readdirSync(tmpBase);
    } catch {}

    // Read LuaLaTeX .log file (name varies by engine invocation)
    for (const f of debugFiles) {
      if (f.endsWith('.log')) {
        try {
          const raw = fs.readFileSync(path.join(tmpBase, f), 'utf8');
          debugLatexLog = sanitizeStderr(raw).substring(0, 100000);
        } catch {}
        break;
      }
    }

    // Read the preamble we injected
    const headerPath = path.join(tmpBase, 'header.tex');
    if (fs.existsSync(headerPath)) {
      try { debugHeaderTex = fs.readFileSync(headerPath, 'utf8'); } catch {}
    }

    // Generate .tex source (fast: no LuaLaTeX, just Pandoc template rendering)
    try {
      const texPath = path.join(tmpBase, 'debug-output.tex');
      const texArgs = args.map(a => a === pdfPath ? texPath : a);
      const texProc = spawn('pandoc', texArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV });
      await new Promise((resolve) => {
        const t = setTimeout(() => { try { texProc.kill('SIGKILL'); } catch {} resolve(); }, 10000);
        texProc.on('close', () => { clearTimeout(t); resolve(); });
        texProc.on('error', () => { clearTimeout(t); resolve(); });
      });
      if (fs.existsSync(texPath)) {
        debugTexSource = fs.readFileSync(texPath, 'utf8').substring(0, 100000);
      }
    } catch {}

    // NOW clean up
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}

    const stderr = result.stderr || '';
    const { errors: structuredErrors, fallbackMessage } = errorTranslator.translateCompileFailure(
      stderr, { safeMode, errorCode: result.error }
    );
    return {
      success: false, error: result.error || 'compile_failed',
      message: fallbackMessage, warnings,
      errors: structuredErrors,
      detail: sanitizeStderr(stderr.split('\n').slice(-80).join('\n')),
      debug: {
        texSource: debugTexSource,
        latexLog: debugLatexLog,
        headerTex: debugHeaderTex,
        filesInDir: debugFiles,
      },
    };
}
```

### 2. `backend/routes/compile.js` — Status endpoint

Ensure the `debug` field from the job result is included in the status response. Find the status handler (likely `GET /api/compile/status/:jobId`) and add `debug` to the response body when the job has failed.

### 3. `frontend/src/app/app/editor-types.ts`

Add `CompileDebug` type. Add `debug` field to whichever type holds compile results.

### 4. `frontend/src/app/app/useCompileQueue.ts`

When a job fails and the status response includes `debug`, pass it through to the component state alongside the existing `errors` array.

### 5. `frontend/src/app/app/PreviewPane.tsx`

In the `ErrorPanel` component, after the existing "Engine log" `<details>`, add new collapsible sections:

```jsx
{debug?.texSource && (
  <details className="mt-2">
    <summary className="...">Generated LaTeX source</summary>
    <pre className="...">{debug.texSource}</pre>
  </details>
)}
{debug?.latexLog && (
  <details className="mt-2">
    <summary className="...">Full engine log</summary>
    <pre className="...">{debug.latexLog}</pre>
  </details>
)}
{debug?.headerTex && (
  <details className="mt-2">
    <summary className="...">Injected preamble (header.tex)</summary>
    <pre className="...">{debug.headerTex}</pre>
  </details>
)}
{debug?.filesInDir && debug.filesInDir.length > 0 && (
  <details className="mt-2">
    <summary className="...">Files in compile directory</summary>
    <pre className="...">{debug.filesInDir.join('\n')}</pre>
  </details>
)}
```

---

## Tasks for You (the user) After Implementation

1. **Test locally:** Start backend + frontend, trigger a compile failure (e.g., invalid markdown with unmatched `$`), and verify the error panel now shows the debug sections.

2. **Inspect the `.tex` source:** With the generated LaTeX visible, you can identify the exact issue — missing packages, broken preamble, font problems, etc.

3. **Check Docker:** The `.tex` generation step runs Pandoc a second time (without LuaLaTeX). Ensure Pandoc is available in the Docker container (it is — it's the primary tool).

4. **Optional: Gate behind debug flag.** The debug artifacts can be large (up to 100KB each). If you want to keep production responses lean, we can gate behind a `debug=true` query parameter. Let me know.
