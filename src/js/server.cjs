const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const root = path.resolve(__dirname, "../..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://localhost:${port}`);
    const filePath = path.join(root, url.pathname === "/" ? "index.html" : url.pathname);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": types[path.extname(filePath)] || "text/plain; charset=utf-8",
      });
      response.end(data);
    });
  })
  .listen(port, () => {
    console.log(`DeliveryGo running at http://localhost:${port}`);
  });
