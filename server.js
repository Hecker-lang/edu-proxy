const express = require("express");
const http = require("http");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8080;

// 1) Ladeanimation bei Root-Request
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Wird entsperrt...</title>
      <style>
        html, body {
          margin: 0;
          height: 100%;
          background: #0d1117;
          color: #ffffff;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .loader {
          text-align: center;
          animation: fadeOut 1s ease-in-out 3s forwards;
        }

        .spinner {
          width: 80px;
          height: 80px;
          border: 8px solid #333;
          border-top: 8px solid #00ffae;
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
          margin: 0 auto 20px;
        }

        .text {
          font-size: 1.5em;
          opacity: 0.9;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.95); visibility: hidden; }
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <div class="spinner"></div>
        <div class="text">Website wird entsperrt...</div>
      </div>
      <script>
        setTimeout(() => {
          window.location.href = "/proxy/";
        }, 3500);
      </script>
    </body>
    </html>
  `);
});

// 2) Proxy-Endpunkt
app.use(
  "/proxy/",
  createProxyMiddleware({
    target: "http://heckergames.rf.gd",
    changeOrigin: true,
    pathRewrite: {
      "^/proxy/": "",
    },
    selfHandleResponse: true,
    onProxyRes: (proxyRes, req, res) => {
      let body = Buffer.from([]);
      proxyRes.on("data", chunk => (body = Buffer.concat([body, chunk])));
      proxyRes.on("end", () => {
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

// 3) 404-Fallback
app.use((req, res) => {
  res.status(404).send("404 – Nicht gefunden");
});

// Start
http.createServer(app).listen(PORT, () => {
  console.log(`Proxy-Server läuft auf Port ${PORT}`);
});
