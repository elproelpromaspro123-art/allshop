import { describe, expect, it } from "vitest";
import {
  buildManualFulfillmentSummary,
  buildTimeline,
  getGuideHint,
  getNextStepText,
  normalizeFulfillmentSummary,
  type Translate,
} from "./order-tracking";
import type { Order } from "../types/database";

const t: Translate = (key, vars) => {
  const suffix = vars
    ? `:${Object.entries(vars)
        .map(([name, value]) => `${name}=${value}`)
        .join(",")}`
    : "";

  return `${key}${suffix}`;
};

function makeOrder(input?: Partial<Order>): Order {
  return {
    id: "0e9797ff-18ae-466f-a210-4525bcaecfee",
    customer_name: "Cliente",
    customer_email: "cliente@example.com",
    customer_phone: "3000000000",
    customer_document: "1000000000",
    shipping_address: "Calle 1 # 2-3",
    shipping_city: "Cucuta",
    shipping_department: "Norte de Santander",
    shipping_zip: null,
    status: "processing",
    payment_id: null,
    payment_method: "contraentrega",
    shipping_type: "nacional",
    subtotal: 80000,
    shipping_cost: 0,
    total: 80000,
    items: [],
    notes: null,
    created_at: "2026-03-17T21:44:15.000Z",
    updated_at: "2026-03-17T21:45:05.000Z",
    ...input,
  };
}

describe("order tracking helpers", () => {
  it("keeps dispatch and shipping pending while manual review is incomplete", () => {
    const order = makeOrder();
    const fulfillment = normalizeFulfillmentSummary({
      has_dispatch_error: false,
      has_dispatch_success: false,
      last_error: null,
      last_event_at: null,
      last_action: null,
      last_status: null,
      skipped_reason: null,
    });

    const timeline = buildTimeline(order, fulfillment, t);

    expect(timeline.map((stage) => [stage.key, stage.state])).toEqual([
      ["registered", "done"],
      ["manual_review", "current"],
      ["dispatch", "todo"],
      ["shipping", "todo"],
      ["delivered", "todo"],
    ]);
    expect(getGuideHint(order, fulfillment, null, t)).toBe(
      "orders.guide.pendingReview",
    );
    expect(getNextStepText(order, fulfillment, t)).toBe(
      "orders.next.processingReview",
    );
  });

  it("marks dispatch as the current step after manual review is approved", () => {
    const order = makeOrder({
      notes: JSON.stringify({
        manual_review: {
          completed: true,
          completed_at: "2026-03-17T21:45:05.000Z",
        },
      }),
    });
    const fulfillment = buildManualFulfillmentSummary(
      order.status,
      order.notes,
      order.updated_at,
    );
    const timeline = buildTimeline(order, fulfillment, t);

    expect(timeline.map((stage) => [stage.key, stage.state])).toEqual([
      ["registered", "done"],
      ["manual_review", "done"],
      ["dispatch", "current"],
      ["shipping", "todo"],
      ["delivered", "todo"],
    ]);
    expect(getGuideHint(order, fulfillment, null, t)).toBe(
      "orders.guide.awaitDispatch",
    );
    expect(getNextStepText(order, fulfillment, t)).toBe(
      "orders.next.processingAwaitDispatch",
    );
  });

  it("keeps shipping as current after dispatch reference exists but no tracking code yet", () => {
    const order = makeOrder({
      notes: JSON.stringify({
        manual_review: {
          completed: true,
          completed_at: "2026-03-17T21:45:05.000Z",
        },
        fulfillment: {
          provider_order_references: ["GUIA-INT-001"],
          dispatched_at: "2026-03-17T22:10:00.000Z",
        },
      }),
    });
    const fulfillment = buildManualFulfillmentSummary(
      order.status,
      order.notes,
      order.updated_at,
    );
    const timeline = buildTimeline(order, fulfillment, t);

    expect(timeline.map((stage) => [stage.key, stage.state])).toEqual([
      ["registered", "done"],
      ["manual_review", "done"],
      ["dispatch", "done"],
      ["shipping", "current"],
      ["delivered", "todo"],
    ]);
    expect(getGuideHint(order, fulfillment, null, t)).toBe(
      "orders.guide.awaitCarrier",
    );
    expect(getNextStepText(order, fulfillment, t)).toBe(
      "orders.next.processingWithRef:reference=GUIA-INT-001",
    );
  });

  it("promotes delivered state only after transit is real", () => {
    const order = makeOrder({
      status: "shipped",
      notes: JSON.stringify({
        manual_review: {
          completed: true,
          completed_at: "2026-03-17T21:45:05.000Z",
        },
        fulfillment: {
          provider_order_references: ["GUIA-INT-001"],
          tracking_candidates: ["TCC12345678"],
          dispatched_at: "2026-03-17T22:10:00.000Z",
        },
      }),
    });
    const fulfillment = buildManualFulfillmentSummary(
      order.status,
      order.notes,
      order.updated_at,
    );
    const timeline = buildTimeline(order, fulfillment, t);

    expect(timeline.map((stage) => [stage.key, stage.state])).toEqual([
      ["registered", "done"],
      ["manual_review", "done"],
      ["dispatch", "done"],
      ["shipping", "done"],
      ["delivered", "current"],
    ]);
    expect(getNextStepText(order, fulfillment, t)).toBe("orders.next.shipped");
  });

  it("preserves cancellation as the last visible stage", () => {
    const order = makeOrder({
      status: "cancelled",
      notes: JSON.stringify({
        manual_review: {
          completed: true,
          completed_at: "2026-03-17T21:45:05.000Z",
        },
      }),
    });
    const timeline = buildTimeline(order, null, t);

    expect(timeline.map((stage) => [stage.key, stage.state])).toEqual([
      ["registered", "done"],
      ["manual_review", "done"],
      ["cancelled", "done"],
    ]);
    expect(getNextStepText(order, null, t)).toBe("orders.next.cancelled");
  });
});
