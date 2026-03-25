import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { app } = require("../backend/src/app");

export default function handler(req, res) {
  // Mount Express app at /api
  req.url = req.url.replace(/^\/api/, "") || "/";
  return app(req, res);
}

