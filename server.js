// server.js
const express = require("express");
const http = require("http");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8080;

// 1) Proxy‑Endpunkt: leitet alle Anfragen unter /proxy/ an deine Website weiter
app.use(
  "/proxy/",
  createProxyMiddleware({
    target: "http://heckergames.rf.gd",  // deine Website
    changeOrigin: true,
    pathRewrite: {
      "^/proxy/": "",                     // entfernt /proxy/ aus dem Pfad
    },
    selfHandleResponse: true,             // für optionales HTML‑Rewriting
    onProxyRes: (proxyRes, req, res) => {
      let body = Buffer.from([]);
      proxyRes.on("data", chunk => (body = Buffer.concat([body, chunk])));
      proxyRes.on("end", () => {
        // Beispiel: alle Links in der HTML-Antwort auf deinen Proxy umschreiben
        let html = body.toString("utf8");
        html = html.replace(
          /href="https?:\/\/heckergames\.rf\.gd\/([^"]*)"/g,
          `href="/proxy/$1"`
        );
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(html);
      });
    },
  })
);

// 2) Root‑Weiterleitung: Besucher landen direkt auf deiner Seite
app.get("/", (req, res) => {
  res.redirect("http://heckergames.rf.gd");
});

// 3) Fallback für alle anderen Pfade
app.use((req, res) => {
  res.status(404).send("404 – Nicht gefunden");
});

// Server starten
http.createServer(app).listen(PORT, () => {
  console.log(`Proxy-Server läuft auf Port ${PORT}`);
});
