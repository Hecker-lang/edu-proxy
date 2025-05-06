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

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy-Route über Query‑Param
app.get('/proxy', (req, res) => {
  let target = req.query.url || 'http://heckergames.rf.gd';
  if (!/^https?:\/\//i.test(target)) {
    target = 'http://' + target;
  }
  // setze req.url auf target
  req.url = target;
  proxy.request(req, res);
});

// Landing‑Page: Auto‑Load + Fullscreen + Spinner
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Game‑Proxy</title>
  <!-- Favicon 🎮 -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='16'%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E">
  <!-- Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-ENjdO4Dr2bkBIFxQpeoEcBH7P3QjK7Sk+6Al6z9ZxkK/AdUQvQWZ5y5y5XtF1MZh" crossorigin="anonymous">
  <style>
    body, html { height:100%; margin:0; }
    body { display:flex; flex-direction:column; }
    header, footer { background:#343a40; color:#fff; text-align:center; padding:1rem; }
    main { flex:1; display:flex; align-items:center; justify-content:center; position:relative; }
    .spinner-container {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
    }
    .loader {
      width:3rem; height:3rem;
      border:0.5rem solid #ccc;
      border-top-color:#007bff;
      border-radius:50%;
      animation:spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #gameFrame {
      width:100%; height:100%;
      border:none; display:none;
    }
    .fullscreen { width:100vw; height:100vh; border:none; }
  </style>
</head>
<body>
  <header>
    <h1 class="h4 mb-0">🎮 Game‑Proxy</h1>
  </header>
  <main>
    <div class="spinner-container" id="spinner">
      <div class="loader"></div>
    </div>
    <iframe id="gameFrame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
  </main>
  <footer>
    <small>© Game‑Proxy • automatisch weitergeleitet zu heckergames.rf.gd</small>
  </footer>
  <script>
    (async () => {
      // Fullscreen‑Modus
      await document.documentElement.requestFullscreen().catch(()=>{});
      const spinner = document.getElementById('spinner');
      const frame   = document.getElementById('gameFrame');
      // Lade‑Animation zeigen
      spinner.style.display = 'block';
      // Proxy‑URL für heckergames
      const target = 'http://heckergames.rf.gd';
      frame.src = '/proxy?url=' + encodeURIComponent(target);
      // Wenn geladen, Spinner verstecken & Frame anzeigen
      frame.addEventListener('load', () => {
        spinner.style.display = 'none';
        frame.style.display   = 'block';
        frame.classList.add('fullscreen');
      });
      // Bei Fehlern
      frame.addEventListener('error', () => {
        spinner.style.display = 'none';
        alert('Fehler beim Laden der Seite.');
      });
    })();
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
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  let target = urlObj.searchParams.get('url') || 'http://heckergames.rf.gd';
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;
  req.url = target;
  proxy.upgrade(req, socket, head);
});
server.listen(PORT, () => {
  console.log('Server läuft auf Port ' + PORT);
});
