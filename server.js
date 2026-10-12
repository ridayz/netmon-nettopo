import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import os from 'os';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Self-healing: install express if missing (portable launcher)
const _require = createRequire(import.meta.url);
try {
  _require.resolve('express');
} catch {
  const { execFileSync } = await import('child_process');
  console.log('[NetTopo] express tidak ditemukan, install otomatis...');
  execFileSync('npm.cmd', ['install', 'express'], {
    cwd: __dirname,
    stdio: 'inherit',
    windowsHide: true,
  });
}

const { default: express } = await import('express');

const app = express();
const PORT = parseInt(process.env.PORT || '8932', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers (useful when frontend dev server is used)
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Static files from Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ─────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'NetTopo', version: '1.0.0', port: PORT });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/archify-export
// Body: { spec: <architecture JSON spec> }
// Returns: standalone archify HTML as download
// ─────────────────────────────────────────────────────────────────
app.post('/api/archify-export', async (req, res) => {
  let tmpJsonPath = null;
  let outHtmlPath = null;
  try {
    const { spec } = req.body;
    if (!spec) {
      return res.status(400).json({ ok: false, error: 'Missing "spec" in request body' });
    }

    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    tmpJsonPath = path.join(tempDir, `nettopo-arch-${timestamp}.json`);
    outHtmlPath = path.join(tempDir, `nettopo-export-${timestamp}.html`);

    if (!spec.meta) spec.meta = {};
    spec.meta.quality_profile = spec.meta.quality_profile || 'showcase';

    const archifyCliPath = 'C:\\Users\\ridwan\\.agents\\skills\\archify\\bin\\archify.mjs';

    const runDeliver = (quality) =>
      new Promise((resolve, reject) => {
        // Re-write the spec file every time (quality_profile may have changed)
        fs.writeFileSync(tmpJsonPath, JSON.stringify(spec, null, 2), 'utf-8');
        execFile(
          'node',
          [archifyCliPath, 'deliver', 'architecture', tmpJsonPath, outHtmlPath,
           '--quality', quality, '--json'],
          { timeout: 60000, windowsHide: true },
          (error, stdout, stderr) => {
            if (error) return reject({ error, stdout, stderr });
            resolve({ stdout, stderr });
          }
        );
      });

    // Try showcase first, fall back to standard
    try {
      await runDeliver('showcase');
    } catch (err1) {
      console.warn('[NetTopo] showcase deliver failed, retrying with standard…',
        err1?.stderr?.slice?.(0, 400) || err1?.error?.message);
      try {
        spec.meta.quality_profile = 'standard';
        await runDeliver('standard');
      } catch (err2) {
        throw new Error(
          'Archify deliver failed: ' +
          (err2?.stderr?.slice?.(0, 400) || err2?.stdout?.slice?.(0, 400) ||
           err2?.error?.message || String(err2))
        );
      }
    }

    if (!fs.existsSync(outHtmlPath)) {
      throw new Error('Archify CLI ran but produced no output HTML file');
    }

    const htmlContent = fs.readFileSync(outHtmlPath, 'utf-8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nettopo-${timestamp}.html"`
    );
    return res.send(htmlContent);
  } catch (err) {
    console.error('[NetTopo] /api/archify-export error:', err?.message || err);
    res.status(500).json({ ok: false, error: err?.message || 'Internal server error' });
  } finally {
    try { if (tmpJsonPath && fs.existsSync(tmpJsonPath)) fs.unlinkSync(tmpJsonPath); } catch (_) {}
    try { if (outHtmlPath && fs.existsSync(outHtmlPath)) fs.unlinkSync(outHtmlPath); } catch (_) {}
  }
});

// ─────────────────────────────────────────────────────────────────
// SPA fallback – serve index.html for any unmatched route
// (Express 4 & 5 compatible: use app.use instead of app.get('*'))
// ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send(
      'NetTopo frontend not built. Run:  npm run build  then restart the server.'
    );
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(` NetTopo Backend running on port ${PORT}`);
  console.log(` http://localhost:${PORT}`);
  console.log('=========================================');
});
