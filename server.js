// server.js
require("dotenv").config();  // lädt Variablen aus .env, falls vorhanden

const express               = require("express");
const helmet                = require("helmet");
const compression           = require("compression");
const morgan                = require("morgan");
const rateLimit             = require("express-rate-limit");
const apicache              = require("apicache");
const basicAuth             = require("express-basic-auth");
const { createProxyMiddleware } = require("http-proxy-middleware");
const promClient            = require("prom-client");
const fetch                 = require("node-fetch");
const zlib                  = require("zlib");
const replaceStream         = require("replacestream");

const app       = express();
const PORT      = process.env.PORT;
const TARGET    = process.env.TARGET_URL      || "http://heckergames.rf.gd";
const LOAD_DELAY= parseInt(process.env.LOAD_DELAY_MS,    10) || 3500;
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT_MS, 10) || 10000;
const USER      = process.env.PROXY_USER;
const PASS      = process.env.PROXY_PASS;

// Pflicht‑Check
if (!PORT) {
  console.error("❌ Kein PORT gesetzt – bitte auf Render deployen oder PORT in der Umgebung setzen.");
  process.exit(1);
}
if (!USER || !PASS) {
  console.error("❌ PROXY_USER und PROXY_PASS müssen als Umgebungsvariablen gesetzt sein.");
  process.exit(1);
}

// ─── Security & Performance ─────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// ─── Rate Limiting & Caching ─────────────────────────────────────────────────
app.use(rateLimit({ windowMs: 60*1000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use(apicache.middleware("5 minutes", (req, res) => res.statusCode === 200 && req.method === "GET"));

// ─── Basic Auth ───────────────────────────────────────────────────────────────
app.use(basicAuth({
  users: { [USER]: PASS },
  challenge: true,
  unauthorizedResponse: () => "401 – Unauthorisiert"
}));

// ─── Prometheus Metriken ─────────────────────────────────────────────────────
promClient.collectDefaultMetrics();
app.get("/metrics", (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(promClient.register.metrics());
});

// ─── Verbesserter Health‑Check ────────────────────────────────────────────────
app.get("/status", async (req, res) => {
  const start = Date.now();
  try {
    const resp = await fetch(TARGET, { method: "HEAD", timeout: PROXY_TIMEOUT });
    const latency = Date.now() - start;
    return res.json({ status: "ok", target: TARGET, latency_ms: latency });
  } catch (err) {
    return res.status(502).json({ status: "error", error: err.message });
  }
});

// ─── Lade‑Animation am Root-Request ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.type("html").send(`
    <!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Website wird entsperrt…</title>
    <style>
      html,body{margin:0;height:100%;background:#0d1117;color:#fff;
        font-family:Segoe UI,sans-serif;display:flex;
        align-items:center;justify-content:center;}
      .loader{text-align:center;}
      .spinner{width:80px;height:80px;border:8px solid #333;
        border-top:8px solid #00ffae;border-radius:50%;
        animation:spin 1.2s linear infinite;margin-bottom:20px;}
      .text{font-size:1.5em;opacity:.9;}
      @keyframes spin{to{transform:rotate(360deg)}}
      #error{display:none;color:#ff6666;margin-top:20px;}
      #reload{display:none;cursor:pointer;margin-top:10px;}
    </style></head><body>
      <div class="loader">
        <div class="spinner"></div>
        <div class="text">Website wird entsperrt…</div>
        <div id="error">Verbindung fehlgeschlagen.<br>
          <button id="reload">Erneut versuchen</button>
        </div>
      </div>
      <script>
        setTimeout(()=>{
          fetch("/status")
            .then(r => r.ok ? location.href="/proxy/" : Promise.reject())
            .catch(()=>{
              document.querySelector(".spinner").style.display="none";
              document.querySelector(".text").style.display="none";
              document.getElementById("error").style.display="block";
              document.getElementById("reload").style.display="inline-block";
            });
        }, ${LOAD_DELAY});
        document.getElementById("reload").onclick = () => location.reload();
      </script>
    </body></html>
  `);
});

// ─── Proxy‑Endpoint with Streaming‑Rewriting ───────────────────────────────────
app.use("/proxy", createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  timeout: PROXY_TIMEOUT,
  proxyTimeout: PROXY_TIMEOUT,
  pathRewrite: { "^/proxy": "" },
  cookieDomainRewrite: { "*": "" },
  secure: false,
  onProxyReq(proxyReq) {
    proxyReq.setHeader("host", new URL(TARGET).host);
  },
  selfHandleResponse: true,
  onProxyRes: (proxyRes, req, res) => {
    const contentType = proxyRes.headers["content-type"] || "";
    if (contentType.includes("text/html")) {
      let stream = proxyRes;
      const enc = proxyRes.headers["content-encoding"];
      if (enc === "gzip")        stream = stream.pipe(zlib.createGunzip());
      else if (enc === "deflate") stream = stream.pipe(zlib.createInflate());
      stream = stream
        .pipe(replaceStream(new RegExp(TARGET.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"),"g"),""))
        .pipe(replaceStream(/(href|src|action)=["']\//g, `$1="/proxy/`));
      if (enc === "gzip")        stream = stream.pipe(zlib.createGzip());
      else if (enc === "deflate") stream = stream.pipe(zlib.createDeflate());
      const headers = { ...proxyRes.headers };
      delete headers["content-length"];
      res.writeHead(proxyRes.statusCode, headers);
      stream.pipe(res);
    } else {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  },
  onError(err, req, res) {
    console.error("Proxy-Fehler:", err.message);
    res.status(502).type("html").send(`
      <h1>502 Bad Gateway</h1>
      <p>Fehler beim Verbinden mit <code>${TARGET}</code>.</p>
      <p><a href="/">Zurück</a> und erneut versuchen.</p>
    `);
  }
}));

// ─── 404‑Fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).send("404 – Nicht gefunden"));

// ─── Server starten ───────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`✅ Proxy-Server läuft auf Port ${PORT}, target=${TARGET}`)
);
