import * as Sentry from "@sentry/nextjs";
import {
  createSentryBeforeSend,
  getRouteSamplingRate,
} from "@/lib/security/sentry";

const filterBeforeSend = createSentryBeforeSend();

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampler: (samplingContext) =>
    getRouteSamplingRate(samplingContext.transactionContext?.name),
  sampleRate: 1,
  beforeSend(event, hint) {
    void hint;
    return filterBeforeSend(event) as typeof event | null;
  },
  debug: false,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});
