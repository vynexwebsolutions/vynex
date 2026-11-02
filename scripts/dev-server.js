/* VYNEX/scripts/dev-server.js — tiny local web server for dist/ (no dependencies).
   Run with:  npm run dev     then open http://localhost:3000 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const port = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".avif": "image/avif", ".txt": "text/plain" };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/admin") { res.writeHead(301, { Location: "/admin/" }); return res.end(); }
  let file = path.normalize(path.join(dist, p));
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end("Forbidden"); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return res.end(fs.readFileSync(path.join(dist, "404.html")));
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`\nVYNEX is running:\n  Website → http://localhost:${port}\n  Admin   → http://localhost:${port}/admin/\n\nPress Ctrl+C to stop.\n`);
});
