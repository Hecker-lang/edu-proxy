const express = require("express");
const http = require("http");
const path = require("path");

// Ersatz für UV oder Corrosion
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8080;

// Proxy-Endpunkt
app.use('/proxy/', createProxyMiddleware({
    target: 'https://amazon.de', // Zielseite, kann dynamisch gesetzt werden
    changeOrigin: true,
    pathRewrite: {
        '^/proxy/': '', // Entfernt "/proxy/" aus dem Pfad
    },
}));

// Automatische Weiterleitung zur Hauptseite (z. B. dein Game Launcher)
app.get("/", (req, res) => {
    res.redirect("https://amazon.de"); // Hier deine Website eintragen
});

// Fallback (z. B. 404)
app.use((req, res) => {
    res.status(404).send("Nicht gefunden");
});

// Server starten
http.createServer(app).listen(PORT, () => {
    console.log(`Proxy läuft auf Port ${PORT}`);
});
