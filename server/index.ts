import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { log } from "./vite";

console.log('[SERVER LOG] server/index.ts loaded');

const app = express();

// CORS Configuration
const viteDevServerOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
console.log(`[SERVER LOG] Configuring CORS to allow origin: ${viteDevServerOrigin}`);
app.use(cors({
  origin: viteDevServerOrigin, // Allow requests from Vite dev server
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port (read from env, default 5001)
  const portToUse = parseInt(process.env.PORT || '5001', 10);
  console.log(`[SERVER LOG] Attempting to start server on port: ${portToUse}`);
  server.listen({
    port: portToUse,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${portToUse}`);
  });
})();
