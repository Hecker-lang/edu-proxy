const express = require('express');
const http = require('http');
const Corrosion = require('@titaniumnetwork-dev/corrosion');
const path = require('path');

const app = express();
const server = http.createServer(app);

const proxy = new Corrosion({
  codec: 'base64',
  prefix: '/proxy/',
  title: 'Loading...',
  stripCSP: true,
  requestOptions: { followRedirects: true }
});

// Statische Dateien (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Nutze die Middleware
app.use('/proxy/', proxy.middleware);

// Optional: automatische Weiterleitung zur Zielseite
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Weiterleitung...</title>
        <meta http-equiv="refresh" content="3; url=/proxy/http://heckergames.rf.gd">
        <style>
          body {
            margin: 0;
            background: #000;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: sans-serif;
          }
          .loader {
            border: 16px solid #f3f3f3;
            border-top: 16px solid #3498db;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div>
          <div class="loader"></div>
          <p>Leite weiter nach heckergames.rf.gd...</p>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
