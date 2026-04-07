import app from "./app";
import { logger } from "./lib/logger";
import { checkAndSendTrialWarnings } from "./lib/trial-warnings";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Trial warning emails: run 1 minute after startup, then every 24 hours
  setTimeout(() => {
    checkAndSendTrialWarnings().catch((err) => logger.error({ err }, "Trial warning check failed"));
  }, 60_000);
  setInterval(() => {
    checkAndSendTrialWarnings().catch((err) => logger.error({ err }, "Trial warning check failed"));
  }, 24 * 60 * 60 * 1000);
});
