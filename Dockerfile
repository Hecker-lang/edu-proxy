# Verwende ein offizielles Node.js-Image
FROM node:16

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json in das Arbeitsverzeichnis
COPY package.json package-lock.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Codes
COPY . .

# Exponiere den Port, auf dem die App läuft
EXPOSE 3000

# Definiere den Befehl, der beim Starten des Containers ausgeführt wird
CMD ["npm", "start"]
