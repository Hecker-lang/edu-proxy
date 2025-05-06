const express = require('express');
const { uvPath, createBareServer } = require('@titaniumnetwork-dev/ultraviolet');
const { createServer } = require('http');
const path = require('path');
const { URL } = require('url');
const bare = require('@tomphttp/bare-server-node');

const app = express();
const PORT = process.env.PORT || 8080;
const bareServer = createBareServer('/bare/');

// Statische Dateien direkt aus aktuellem Verzeichnis
app.use(express.static(__dirname));

// Ultraviolet core-Dateien
app.use('/uv/', express.static(uvPath));

// Weiterleitung bei Service-Zugriff
app.get('/service/', (req, res) => res.redirect('/'));

// Server erstellen
const server = createServer();

server.on('request', (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  if (parsed.pathname.startsWith('/bare/')) {
    bareServer.emit('request', req, res);
  } else {
    app(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  if (parsed.pathname.startsWith('/bare/')) {
    bareServer.emit('upgrade', req, socket, head);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Ultraviolet Proxy läuft auf Port ${PORT}`);
});
