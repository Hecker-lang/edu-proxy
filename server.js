// server.js
require("dotenv").config();
const express               = require("express");
const helmet                = require("helmet");
const compression           = require("compression");
const morgan                = require("morgan");
const rateLimit             = require("express-rate-limit");
const apicache              = require("apicache");
const basicAuth             = require("express-basic-auth");
const { createProxyMiddleware } = require("http-proxy-middleware");
const promClient            = require("prom-client");

const app       = express();
const PORT      = process.env.PORT;
const TARGET    = process.env.TARGET_URL      || "http://heckergames.rf.gd";
const LOAD_DELAY= parseInt(process.env.LOAD_DELAY_MS,    10) || 3500;
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT_MS, 10) || 10000;
const USER      = process.env.PROXY_USER;
const PASS      = process.env.PROXY_PASS;

if (!PORT)  { console.error("❌ PORT fehlt"); process.exit(1); }
if (!USER || !PASS) {
  console.error("❌ PROXY_USER und PROXY_PASS müssen gesetzt sein");
  process.exit(1);
}

// Security & Performance
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// Rate Limit & Cache
app.use(rateLimit({ windowMs:60*1000, max:60 }));
app.use(apicache.middleware("5 minutes", (req,res)=>res.statusCode===200 && req.method==="GET"));

// Prometheus-Metrics (ohne Auth)
promClient.collectDefaultMetrics();
app.get("/metrics", (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(promClient.register.metrics());
});

// Health-Check (ohne Auth)
app.get("/status", (req, res) => res.json({ status: "ok", target: TARGET }));

// Loader-Page (ohne Auth)
app.get("/", (req, res) => {
  res.type("html").send(`
    <!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Entsperrung…</title>
    <style>
      html,body{margin:0;width:100%;height:100vh;
        display:flex;align-items:center;justify-content:center;
        background:#0d1117;color:#fff;font-family:Segoe UI,sans-serif;}
      .loader{text-align:center;}
      .spinner{width:80px;height:80px;border:8px solid #333;
        border-top:8px solid #00ffae;border-radius:50%;
        animation:spin 1.2s linear infinite;margin-bottom:16px;}
      .text{font-size:1.25em;}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style></head><body>
      <div class="loader">
        <div class="spinner"></div>
        <div class="text">Website wird entsperrt…</div>
      </div>
      <script>
        setTimeout(()=> location.href="/proxy/", ${LOAD_DELAY});
      </script>
    </body></html>
  `);
});

// Proxy mit Basic‑Auth nur hier
app.use("/proxy",
  basicAuth({
    users: { [USER]: PASS },
    challenge: true,
    unauthorizedResponse: "401 – Unauthorisiert"
  }),
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    timeout: PROXY_TIMEOUT,
    proxyTimeout: PROXY_TIMEOUT,
    pathRewrite: { "^/proxy": "" },
    cookieDomainRewrite: { "*": "" },
    secure: false,
    onError(err, req, res) {
      console.error("Proxy-Fehler:", err.message);
      res.status(502).send(`
        <h1>502 Bad Gateway</h1>
        <p>Verbindung zu <code>${TARGET}</code> fehlgeschlagen.</p>
        <p><a href="/">Neustart</a></p>
      `);
    }
  })
);

// 404-Fallback
app.use((req, res) => res.status(404).send("404 – Nicht gefunden"));

// Start
app.listen(PORT, () => {
  console.log(\`✅ Server läuft auf Port \${PORT}, proxy→\${TARGET}\`);
});
