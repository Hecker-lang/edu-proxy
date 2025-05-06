# Verwende ein offizielles Node.js-Image
FROM node:14

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json (falls vorhanden)
COPY package.json package-lock.json ./

# Installiere alle Abhängigkeiten ohne Cache
RUN npm install --no-cache

# Kopiere den restlichen Code in den Container
COPY . .

# Öffne Port 3000 für die Anwendung (falls nötig)
EXPOSE 3000

# Starte die Anwendung (ersetze server.js durch deine Startdatei)
CMD ["node", "server.js"]
