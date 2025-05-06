const express   = require('express');
const http      = require('http');
const Corrosion = require('corrosion');
const PORT      = process.env.PORT || 3000;

const app = express();

// Corrosion‑Proxy mit Base64‑Codec und WebSocket‑Support
const proxy = Corrosion({
  prefix: '/proxy/',
  codec: 'base64',
  stripCSP: true,
  ws: true,
  requestOptions: { jar: true, followRedirect: true, maxRedirects: 10 }
});
app.use(proxy);

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Landing‑Page: Fullscreen, Loader, Auto‑Redirect
app.get('/', (req, res) => {
  // Vorkodierte Ziel‑URL (heckergames.rf.gd)
  const target = 'aHR0cDovL2hlY2tlcmdhbWVzLnJmLmdk'; // btoa('http://heckergames.rf.gd')
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Game‑Proxy</title>
  <!-- Favicon 🎮 -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0%200%2016%2016'%3E%3Ctext y='14' font-size='16'%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E">
  <style>
    html,body{height:100%;margin:0;display:flex;flex-direction:column}
    header,footer{background:#222;color:#fff;text-align:center;padding:1rem}
    main{flex:1;position:relative;background:#000}
    #loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:3rem;height:3rem;border:.5rem solid #444;border-top-color:#0d6efd;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    #gameFrame{width:100%;height:100%;border:none;display:none}
  </style>
</head>
<body>
  <header><h1>🎮 Game‑Proxy</h1></header>
  <main>
    <div id="loader"></div>
    <iframe id="gameFrame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
  </main>
  <footer><small>© Game‑Proxy • Redirect zu heckergames.rf.gd</small></footer>
  <script>
    (async()=>{
      try { await document.documentElement.requestFullscreen() } catch{}  
      const loader = document.getElementById('loader');
      const frame  = document.getElementById('gameFrame');
      // Base64‑Parameter an Proxy übergeben
      frame.src = '/proxy/${target}';
      frame.addEventListener('load', ()=>{
        loader.style.display = 'none';
        frame.style.display  = 'block';
      });
      frame.addEventListener('error', ()=>{
        loader.style.display = 'none';
        alert('Fehler beim Laden.');
      });
    })();
  </script>
</body>
</html>`);
});

// 404‑Handler
app.use((req, res) => res.status(404).send('404 – Nicht gefunden'));

// Error‑Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('500 – Interner Serverfehler');
});

// HTTP‑Server + WebSocket‑Upgrade
const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => proxy.upgrade(req, socket, head));
server.listen(PORT, () => {
  console.log('Server läuft auf Port ' + PORT);
});
