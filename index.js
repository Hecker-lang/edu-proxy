const express   = require('express');
const corrosion = require('@titaniumnetwork-dev/corrosion').default;
const PORT      = process.env.PORT || 3000;

const app = express();

// --- Logging aller Anfragen ---
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// --- Corrosion‑Proxy unter /proxy/ ---
app.use(
  '/proxy/',
  corrosion({
    prefix: '/proxy/',
    stripCSP: true,
    ws: true,
    requestOptions: {
      jar: true,
      followRedirect: true,
      maxRedirects: 10
    }
  })
);

// --- Landing‑Page mit eingebetteter UI ---
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Game‑Proxy</title>
  <!-- SVG‑Favicon 🎮 -->
  <link rel="icon"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='16'%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E">
  <!-- Bootstrap 5 CDN -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-ENjdO4Dr2bkBIFxQpeoEcBH7P3QjK7Sk+6Al6z9ZxkK/AdUQvQWZ5y5y5XtF1MZh"
        crossorigin="anonymous">
  <style>
    body { display: flex; flex-direction: column; min-height: 100vh; }
    header, footer { background: #343a40; color: #fff; padding: 1rem; }
    main { flex: 1; padding: 1rem; }
    #gameFrame { width: 100%; height: 75vh; border: 2px solid #dee2e6; border-radius: .25rem; display: none; }
    #spinner { display: none; }
  </style>
</head>
<body>
  <header class="text-center">
    <h1 class="h3">🎮 Game‑Proxy</h1>
    <p class="mb-0">Spiele deine Lieblings‑Games direkt hier.</p>
  </header>
  <main class="container">
    <form id="proxyForm" class="row g-2 align-items-center mb-3">
      <div class="col-sm-10">
        <input type="url" id="targetUrl" class="form-control"
               placeholder="https://example.com/dein-game" required>
      </div>
      <div class="col-sm-2">
        <button type="submit" class="btn btn-primary w-100">Spiel laden</button>
      </div>
    </form>
    <div id="spinner" class="text-center mb-3">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Lädt…</span>
      </div>
    </div>
    <div id="gameContainer">
      <iframe id="gameFrame"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
      </iframe>
    </div>
  </main>
  <footer class="text-center mt-auto">
    <small>© Game‑Proxy • öffentlich zugänglich</small>
  </footer>
  <script>
    const form      = document.getElementById('proxyForm');
    const frame     = document.getElementById('gameFrame');
    const spinner   = document.getElementById('spinner');
    form.addEventListener('submit', e => {
      e.preventDefault();
      spinner.style.display = 'block';
      frame.style.display   = 'none';
      const url = document.getElementById('targetUrl').value;
      frame.src = '/proxy/' + encodeURIComponent(url);
    });
    frame.addEventListener('load', () => {
      spinner.style.display = 'none';
      frame.style.display   = 'block';
    });
    frame.addEventListener('error', () => {
      spinner.style.display = 'none';
      alert('Fehler beim Laden der Seite. Bitte überprüfe die URL.');
    });
  </script>
</body>
</html>`);
});

// --- 404‑Handler ---
app.use((req, res) => {
  res.status(404).send('404 – Seite nicht gefunden');
});

// --- Globales Error‑Handling ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('500 – Interner Serverfehler');
});

// --- Server starten ---
app.listen(PORT, () => {
  console.log('Server läuft auf Port ' + PORT);
});
