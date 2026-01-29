// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0ae2d5a2b23521949ec377e0f97124e9@o4510762289266688.ingest.de.sentry.io/4510762308141136",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Ignore expected errors that are not actionable bugs
  ignoreErrors: [
    // Next.js expected navigation errors
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    // Webpack cache errors (dev environment)
    /ENOENT.*\.next\/cache/,
    /Cannot find module '\.\/\d+\.js'/,
    /Cannot find module '.*vendor-chunks/,
  ],
});
