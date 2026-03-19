import type { Order } from "@/types/database";

export interface FulfillmentSummary {
  has_dispatch_error: boolean;
  has_dispatch_success: boolean;
  last_error: string | null;
  last_event_at: string | null;
  last_action: string | null;
  last_status: string | null;
  skipped_reason: string | null;
}

export type TimelineState = "done" | "current" | "todo" | "warning";

export interface TimelineStage {
  key: string;
  label: string;
  detail: string;
  when: string | null;
  state: TimelineState;
}

export type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

function parseOrderNotes(rawNotes: unknown): Record<string, unknown> {
  if (!rawNotes) return {};
  try {
    const parsed =
      typeof rawNotes === "string"
        ? (JSON.parse(rawNotes) as unknown)
        : rawNotes;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value.trim());
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function extractDispatchReference(notes: unknown): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const references = fulfillment.provider_order_references;
  if (!Array.isArray(references)) return null;
  const found = references.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return typeof found === "string" ? found.trim() : null;
}

export function extractTrackingCode(notes: unknown): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;
  if (!Array.isArray(candidates)) return null;
  const found = candidates.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return typeof found === "string" ? found.trim() : null;
}

export function extractManualReview(notes: unknown): {
  completed: boolean;
  completedAt: string | null;
} {
  const parsed = parseOrderNotes(notes);
  const manualReview = getRecord(parsed.manual_review);
  const completed = manualReview.completed === true;
  const completedAt =
    typeof manualReview.completed_at === "string"
      ? manualReview.completed_at
      : null;
  return { completed, completedAt };
}

export function extractDispatchedAt(notes: unknown): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  return toIsoDate(fulfillment.dispatched_at);
}

export function normalizeFulfillmentSummary(
  value: unknown,
): FulfillmentSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return {
    has_dispatch_error: source.has_dispatch_error === true,
    has_dispatch_success: source.has_dispatch_success === true,
    last_error:
      typeof source.last_error === "string"
        ? source.last_error.trim() || null
        : null,
    last_event_at: toIsoDate(source.last_event_at),
    last_action:
      typeof source.last_action === "string"
        ? source.last_action.trim() || null
        : null,
    last_status:
      typeof source.last_status === "string"
        ? source.last_status.trim() || null
        : null,
    skipped_reason:
      typeof source.skipped_reason === "string"
        ? source.skipped_reason.trim() || null
        : null,
  };
}

export function buildManualFulfillmentSummary(
  status: string,
  notes: unknown,
  updatedAt?: string | null,
): FulfillmentSummary {
  const normalizedStatus = String(status || "").toLowerCase();
  const dispatchReference = extractDispatchReference(notes);
  const trackingCode = extractTrackingCode(notes);
  const dispatchedAt = extractDispatchedAt(notes);
  const isDispatchedLike =
    Boolean(dispatchReference) ||
    Boolean(trackingCode) ||
    Boolean(dispatchedAt) ||
    normalizedStatus === "shipped" ||
    normalizedStatus === "delivered";

  return {
    has_dispatch_error: false,
    has_dispatch_success: isDispatchedLike,
    last_error: null,
    last_event_at: isDispatchedLike ? dispatchedAt || updatedAt || null : null,
    last_action: isDispatchedLike ? "manual_dispatch" : null,
    last_status: isDispatchedLike ? "success" : null,
    skipped_reason: null,
  };
}

export function getGuideHint(
  order: Order,
  fulfillment: FulfillmentSummary | null,
  trackingCode: string | null,
  t: Translate,
): string | null {
  if (trackingCode) return null;
  const manualReview = extractManualReview(order.notes);
  const dispatchReference = extractDispatchReference(order.notes);
  const dispatchedAt = extractDispatchedAt(order.notes);
  const dispatchStarted =
    Boolean(dispatchReference) ||
    Boolean(dispatchedAt) ||
    fulfillment?.has_dispatch_success === true ||
    order.status === "shipped" ||
    order.status === "delivered";

  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.guide.dispatchErrorWithDetail", {
            detail: fulfillment.last_error,
          })
        : t("orders.guide.dispatchErrorNoDetail");
    }
    return t("orders.guide.pendingReview");
  }
  if (order.status === "processing") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.guide.dispatchErrorWithDetail", {
            detail: fulfillment.last_error,
          })
        : t("orders.guide.dispatchErrorNoDetail");
    }
    if (!manualReview.completed) {
      return t("orders.guide.pendingReview");
    }
    if (!dispatchStarted) {
      return t("orders.guide.awaitDispatch");
    }
    return t("orders.guide.awaitCarrier");
  }
  if (["shipped", "delivered"].includes(order.status)) {
    return t("orders.guide.awaitCarrier");
  }
  return t("orders.guide.unavailable");
}

export function buildTimeline(
  order: Order,
  fulfillment: FulfillmentSummary | null,
  t: Translate,
): TimelineStage[] {
  const dispatchReference = extractDispatchReference(order.notes);
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchedAt = extractDispatchedAt(order.notes);
  const manualReview = extractManualReview(order.notes);
  const isCancelled =
    order.status === "cancelled" || order.status === "refunded";

  const stages: TimelineStage[] = [
    {
      key: "registered",
      label: t("orders.timeline.registered.label"),
      detail: t("orders.timeline.registered.detail"),
      when: toIsoDate(order.created_at),
      state: "done",
    },
  ];

  const manualDone = manualReview.completed;
  const statusIsShippedOrDelivered =
    order.status === "shipped" || order.status === "delivered";
  const deliveredDoneRaw = order.status === "delivered";
  const shippedDoneRaw = Boolean(trackingCode) || deliveredDoneRaw;
  const dispatchDoneRaw =
    Boolean(dispatchReference) ||
    Boolean(dispatchedAt) ||
    fulfillment?.has_dispatch_success === true ||
    statusIsShippedOrDelivered ||
    Boolean(trackingCode);

  const canDispatch = manualDone;
  const canShip = manualDone && dispatchDoneRaw;
  const canDeliver = manualDone && dispatchDoneRaw && shippedDoneRaw;

  const dispatchDone = canDispatch && dispatchDoneRaw;
  const shippedDone = canShip && shippedDoneRaw;
  const deliveredDone = canDeliver && deliveredDoneRaw;

  if (isCancelled) {
    stages.push({
      key: "manual_review",
      label: t("orders.timeline.manualReview.label"),
      detail: manualDone
        ? t("orders.timeline.manualReview.doneDetail")
        : t("orders.timeline.manualReview.skippedDetail"),
      when: manualDone ? manualReview.completedAt : null,
      state: manualDone ? "done" : "warning",
    });
    stages.push({
      key: "cancelled",
      label:
        order.status === "refunded"
          ? t("orders.timeline.refunded.label")
          : t("orders.timeline.cancelled.label"),
      detail: t("orders.timeline.cancelled.detail"),
      when: toIsoDate(order.updated_at),
      state: "done",
    });
    return stages;
  }

  stages.push({
    key: "manual_review",
    label: t("orders.timeline.manualReview.labelActive"),
    detail: manualDone
      ? t("orders.timeline.manualReview.detailDone")
      : t("orders.timeline.manualReview.detailPending"),
    when: manualDone ? manualReview.completedAt : toIsoDate(order.created_at),
    state: manualDone ? "done" : "current",
  });

  const dispatchCurrent = canDispatch && !dispatchDone;
  const dispatchError = canDispatch && fulfillment?.has_dispatch_error === true;
  stages.push({
    key: "dispatch",
    label: t("orders.timeline.dispatch.label"),
    detail: !canDispatch
      ? t("orders.timeline.dispatch.awaitingReview")
      : dispatchError
        ? fulfillment?.last_error
          ? t("orders.timeline.dispatch.errorWithDetail", {
              detail: fulfillment.last_error,
            })
          : t("orders.timeline.dispatch.errorNoDetail")
        : dispatchReference
          ? t("orders.timeline.dispatch.reference", {
              reference: dispatchReference,
            })
          : dispatchCurrent
            ? t("orders.timeline.dispatch.awaitingReference")
            : t("orders.timeline.dispatch.awaitingReview"),
    when:
      dispatchDone || dispatchError
        ? dispatchedAt || fulfillment?.last_event_at || null
        : null,
    state: !canDispatch
      ? "todo"
      : dispatchError
        ? "warning"
        : dispatchDone
          ? "done"
          : "current",
  });

  const shippedCurrent = canShip && !shippedDone;
  stages.push({
    key: "shipping",
    label: t("orders.timeline.shipping.label"),
    detail: !canShip
      ? t("orders.timeline.shipping.awaitingDispatch")
      : trackingCode
        ? t("orders.timeline.shipping.tracking", { code: trackingCode })
        : t("orders.timeline.shipping.awaitingTracking"),
    when: shippedDone ? toIsoDate(order.updated_at) : null,
    state: shippedDone ? "done" : shippedCurrent ? "current" : "todo",
  });

  const deliveredCurrent = canDeliver && !deliveredDone;
  stages.push({
    key: "delivered",
    label: t("orders.timeline.delivered.label"),
    detail: deliveredDone
      ? t("orders.timeline.delivered.done")
      : deliveredCurrent
        ? t("orders.timeline.delivered.awaitingConfirmation")
        : t("orders.timeline.delivered.awaitingTransit"),
    when: deliveredDone ? toIsoDate(order.updated_at) : null,
    state: deliveredDone ? "done" : deliveredCurrent ? "current" : "todo",
  });

  return stages;
}

export function getNextStepText(
  order: Order,
  fulfillment: FulfillmentSummary | null,
  t: Translate,
): string {
  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.next.dispatchErrorWithDetail", {
            detail: fulfillment.last_error,
          })
        : t("orders.next.dispatchErrorNoDetail");
    }
    return t("orders.next.pendingReview");
  }
  if (order.status === "processing") {
    const manualReview = extractManualReview(order.notes);
    const dispatchReference = extractDispatchReference(order.notes);
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.next.dispatchErrorWithDetail", {
            detail: fulfillment.last_error,
          })
        : t("orders.next.dispatchErrorNoDetail");
    }
    if (!manualReview.completed) {
      return t("orders.next.processingReview");
    }
    if (dispatchReference) {
      return t("orders.next.processingWithRef", {
        reference: dispatchReference,
      });
    }
    return t("orders.next.processingAwaitDispatch");
  }
  if (order.status === "shipped") {
    return t("orders.next.shipped");
  }
  if (order.status === "delivered") {
    return t("orders.next.delivered");
  }
  if (order.status === "cancelled") {
    return t("orders.next.cancelled");
  }
  if (order.status === "refunded") {
    return t("orders.next.refunded");
  }
  return t("orders.next.updated");
}
