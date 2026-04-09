import express, { type Express } from "express";
import { buildWidgetScript } from "./lib/widget-script";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { webhookHandler } from "./routes/billing";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));

// Stripe webhook must receive raw body — register before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), webhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
    }),
    secret: process.env.SESSION_SECRET || "souklick-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// Serve the embeddable widget script
app.get("/widget.js", (req, res) => {
  const apiBase = process.env.APP_URL ?? `${req.protocol}://${req.headers.host}`;
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(buildWidgetScript(apiBase));
});

app.use("/api", router);

// Serve the React frontend in production
const frontendDist = path.resolve(__dirname, "../../souklick/dist/public");

app.use(express.static(frontendDist));
// SPA fallback — all non-API routes return index.html so React Router works
app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
