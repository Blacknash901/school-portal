import * as Sentry from "@sentry/react";

// Get Sentry configuration from environment variables
const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
const sentryEnvironment =
  process.env.REACT_APP_SENTRY_ENVIRONMENT || "development";
const enableSentry = process.env.REACT_APP_ENABLE_SENTRY === "true";

// Only initialize Sentry if DSN is provided and enabled
if (sentryDsn && enableSentry) {
  console.log("🔍 Initializing Sentry for environment:", sentryEnvironment);

  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(), // optional, for session replay
    ],
    tracesSampleRate: sentryEnvironment === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1, // record 10% of sessions
    replaysOnErrorSampleRate: 1.0, // record all sessions with errors
  });
} else {
  console.log(
    "ℹ️ Sentry is disabled. Set REACT_APP_SENTRY_DSN and REACT_APP_ENABLE_SENTRY=true to enable."
  );
}
