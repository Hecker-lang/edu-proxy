const express   = require('express');
const http      = require('http');
const Corrosion = require('corrosion');
const PORT      = process.env.PORT || 3000;

const app   = express();
const proxy = new Corrosion({
  stripCSP: true,
  ws: true,
  requestOptions: { jar: true, followRedirect: true, maxRedirects: 10 }
});

// Logging aller Anfragen
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy über Query‑Parameter: /proxy?url=<Ziel‑URL>
app.get('/proxy', (req, res) => {
  let target = req.query.url;
  if (!target) {
    return res.status(400).send('Bitte URL angeben, z. B.: /proxy?url=https://example.com');
  }
  // Protokoll automatisch ergänzen, falls fehlt
  if (!/^https?:\/\//i.test(target)) {
    target = 'http://' + target;
  }
  // req.url auf die Ziel‑URL umbiegen
  req.url = target;
  proxy.request(req, res);
});

// Landing‑Page mit Fullscreen‑Button, Spinner und Favicon
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Game‑Proxy</title>
  <!-- SVG‑Favicon 🎮 -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='16'%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E">
  <!-- Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-ENjdO4Dr2bkBIFxQpeoEcBH7P3QjK7Sk+6Al6z9ZxkK/AdUQvQWZ5y5y5XtF1MZh"
        crossorigin="anonymous">
  <style>
    body { display:flex;flex-direction:column;min-height:100vh;margin:0; }
    header,footer { background:#343a40;color:#fff;padding:1rem;text-align:center; }
    main { flex:1;padding:1rem; }
    #gameFrame { display:none;width:100%;height:100%;border:none; }
    #spinner { display:none;margin:1rem auto;text-align:center; }
    .fullscreen-container { position:relative;width:100%;height:75vh; }
  </style>
</head>
<body>
  <header>
    <h1 class="h3">🎮 Game‑Proxy</h1>
    <p class="mb-0">Spiele deine Lieblings‑Games direkt hier.</p>
  </header>
  <main class="container">
    <form id="proxyForm" class="row g-2 align-items-center mb-3">
      <div class="col-sm-10">
        <input type="url" id="targetUrl" class="form-control"
               placeholder="https://example.com/dein-game" required>
      </div>
      <div class="col-sm-2 d-grid">
        <button type="submit" class="btn btn-primary">Spiel & Vollbild</button>
      </div>
    </form>
    <div id="spinner">
      <div class="spinner-border" role="status"><span class="visually-hidden">Lädt…</span></div>
    </div>
    <div class="fullscreen-container">
      <iframe id="gameFrame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
    </div>
  </main>
  <footer>
    <small>© Game‑Proxy • öffentlich zugänglich</small>
  </footer>
  <script>
    const form    = document.getElementById('proxyForm');
    const frame   = document.getElementById('gameFrame');
    const spinner = document.getElementById('spinner');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      // Fullscreen starten
      await document.documentElement.requestFullscreen().catch(()=>{});
      spinner.style.display = 'block';
      frame.style.display   = 'none';
      let url = document.getElementById('targetUrl').value;
      frame.src = '/proxy?url=' + encodeURIComponent(url);
    });

    frame.addEventListener('load', () => {
      spinner.style.display = 'none';
      frame.style.display   = 'block';
    });

    frame.addEventListener('error', () => {
      spinner.style.display = 'none';
      alert('Fehler beim Laden. Bitte URL prüfen.');
    });
  </script>
</body>
</html>`);
});

// 404‑Handler
app.use((req, res) => res.status(404).send('404 – Seite nicht gefunden'));

// Globales Error‑Handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('500 – Interner Serverfehler');
});

// HTTP‑Server + WebSocket‑Upgrade
const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => {
  // Proxy‑in‑Proxy: Query‑Param auslesen
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  let target = urlObj.searchParams.get('url');
  if (!target) return socket.destroy();
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;
  req.url = target;
  proxy.upgrade(req, socket, head);
});
server.listen(PORT, () => {
  console.log('Server läuft auf Port ' + PORT);
});
