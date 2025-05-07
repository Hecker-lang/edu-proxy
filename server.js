// server.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT; // Render stellt diesen Port bereit

if (!PORT) {
  console.error("❌ Kein PORT gesetzt – bitte auf Render deployen oder PORT in der Umgebung setzen.");
  process.exit(1);
}

// 1) Lade‑Animation bei Root-Request
app.get("/", (req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="UTF-8"><title>Wird entsperrt…</title>
      <style>
        html,body{margin:0;height:100%;background:#0d1117;color:#fff;
          font-family:Segoe UI,sans-serif;display:flex;
          align-items:center;justify-content:center;overflow:hidden;}
        .loader{text-align:center;
          animation:fadeOut 1s ease-in-out 3s forwards;}
        .spinner{width:80px;height:80px;border:8px solid #333;
          border-top:8px solid #00ffae;border-radius:50%;
          animation:spin 1.2s linear infinite;margin:0 auto 20px;}
        .text{font-size:1.5em;opacity:.9;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeOut{to{opacity:0;transform:scale(.95);visibility:hidden}}
      </style>
    </head>
    <body>
      <div class="loader">
        <div class="spinner"></div>
        <div class="text">Website wird entsperrt…</div>
      </div>
      <script>
        setTimeout(()=>location.href="/proxy/",3500);
      </script>
    </body>
    </html>
  `);
});

// 2) Proxy‑Endpoint mit Fehler‑Handling
app.use("/proxy", createProxyMiddleware({
  target: "http://heckergames.rf.gd",
  changeOrigin: true,
  pathRewrite: { "^/proxy": "" },
  onError(err, req, res) {
    console.error("Proxy-Fehler:", err.message);
    res.status(502).type("text").send(
      "Fehler beim Verbinden mit der Zielseite. Bitte später erneut versuchen."
    );
  },
  onProxyReq(proxyReq, req) {
    console.log(`Proxying ${req.method} ${req.originalUrl}`);
  }
}));

// 3) 404‑Fallback
app.use((req, res) => {
  res.status(404).send("404 – Nicht gefunden");
});

// 4) Server starten
app.listen(PORT, () => {
  console.log(`✅ Proxy-Server läuft auf Port ${PORT}`);
});
