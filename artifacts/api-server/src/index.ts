import app from "./app";
import { logger } from "./lib/logger";
import { checkAndSendTrialWarnings } from "./lib/trial-warnings";
import { refreshAllCompetitors } from "./lib/competitor-refresh";
import { sendWeeklyDigests } from "./lib/weekly-digest";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user_sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
    );
    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
  `);
  logger.info("user_sessions table ensured");
}

ensureSessionTable()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");

      setTimeout(() => {
        checkAndSendTrialWarnings().catch((err) => logger.error({ err }, "Trial warning check failed"));
        refreshAllCompetitors().catch((err) => logger.error({ err }, "Competitor refresh failed"));
        sendWeeklyDigests().catch((err) => logger.error({ err }, "Weekly digest failed"));
      }, 60_000);
      setInterval(() => {
        checkAndSendTrialWarnings().catch((err) => logger.error({ err }, "Trial warning check failed"));
        refreshAllCompetitors().catch((err) => logger.error({ err }, "Competitor refresh failed"));
        sendWeeklyDigests().catch((err) => logger.error({ err }, "Weekly digest failed"));
      }, 24 * 60 * 60 * 1000);
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to ensure session table");
    process.exit(1);
  });
