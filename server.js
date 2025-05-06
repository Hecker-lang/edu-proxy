const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('.'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tarn-Proxy-Endpunkt
app.all('/assets/loader', async (req, res) => {
    const target = req.query.q;
    if (!target || !/^https?:\/\//.test(target)) {
        return res.status(400).send('Ungültige oder fehlende URL.');
    }

    try {
        const response = await fetch(target, {
            method: req.method,
            headers: {
                ...req.headers,
                host: new URL(target).host
            },
            body: ['POST', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined,
            redirect: 'follow'
        });

        const contentType = response.headers.get('content-type') || 'text/plain';
        res.set('Content-Type', contentType);
        const body = await response.buffer();
        res.send(body);
    } catch (err) {
        res.status(500).send('Proxy error: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy läuft auf Port ${PORT}`);
});
