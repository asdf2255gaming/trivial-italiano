// Salva e legge spicchi e domande in un file JSON nella cartella del progetto
// (dati/spicchi.json), servito dal dev server su /api/spicchi.
const fs = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, "..", "..", "..", "dati", "spicchi.json");
const MAX_BYTES = 5 * 1024 * 1024;

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

// Solo il PC su cui gira il gioco può modificare il file
const isLocal = (req) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

const readFile = (res) => {
  fs.readFile(FILE, "utf8", (err, text) => {
    if (err) {
      if (err.code === "ENOENT") return send(res, 200, { exists: false });
      return send(res, 500, { error: err.message });
    }
    try {
      send(res, 200, { ...JSON.parse(text), exists: true });
    } catch {
      send(res, 500, { error: "Il file dati/spicchi.json non è un JSON valido" });
    }
  });
};

const writeFile = (req, res) => {
  if (!isLocal(req)) return send(res, 403, { error: "Salvataggio consentito solo da questo PC" });

  const chunks = [];
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BYTES) {
      send(res, 413, { error: "Dati troppo grandi" });
      req.destroy();
    } else {
      chunks.push(chunk);
    }
  });
  req.on("end", () => {
    if (res.writableEnded) return;
    let data;
    try {
      data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(res, 400, { error: "JSON non valido" });
    }
    if (!data || !Array.isArray(data.categories)) {
      return send(res, 400, { error: "Manca l'elenco degli spicchi" });
    }
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      const text = JSON.stringify(data, null, 2);
      // Scrittura su file temporaneo e poi rinomina, per non lasciare il file a metà
      const tmp = `${FILE}.tmp`;
      fs.writeFileSync(tmp, text, "utf8");
      try {
        fs.renameSync(tmp, FILE);
      } catch {
        fs.writeFileSync(FILE, text, "utf8");
        fs.rmSync(tmp, { force: true });
      }
      send(res, 200, { ok: true });
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  });
};

const middleware = (req, res, next) => {
  if (req.method === "GET") return readFile(res);
  if (req.method === "PUT") return writeFile(req, res);
  next();
};

module.exports = { path: "/api/spicchi", middleware, FILE };
