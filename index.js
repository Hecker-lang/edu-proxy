const express   = require('express');
const Unblocker = require('unblocker');
const PORT      = process.env.PORT || 3000;

const app = express();

// Proxy‑Middleware unter /proxy/
app.use(
  Unblocker({
    prefix: '/proxy/',
    requestOptions: {
      jar: true,
      followRedirect: true,
      maxRedirects: 10
    },
    block: []
  })
);

// Startseite mit Nutzungshinweis
app.get('/', (req, res) => {
  const host = req.get('host');
  res.send(
    '<h1>Render-Proxy</h1>' +
    '<p>Nutze <code>/proxy/&lt;URL&gt;</code>, z. B.:</p>' +
    '<pre>https://' + host + '/proxy/https://example.com</pre>'
  );
});

app.listen(PORT, () => {
  console.log('Server läuft auf Port ' + PORT);
});
