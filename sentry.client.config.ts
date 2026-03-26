import * as Sentry from "@sentry/nextjs";
import {
  createSentryBeforeSend,
  getRouteSamplingRate,
  getTracePropagationTargets,
} from "@/lib/security/sentry";

const filterBeforeSend = createSentryBeforeSend();

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampler: (samplingContext) =>
    getRouteSamplingRate(samplingContext.transactionContext?.name),
  tracePropagationTargets: getTracePropagationTargets(),
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1,
  sampleRate: 1,
  beforeSend(event, hint) {
    void hint;
    return filterBeforeSend(event) as typeof event | null;
  },
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration(),
  ],
  debug: false,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});
