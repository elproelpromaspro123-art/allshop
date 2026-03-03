export const TRUST_VISUALS = {
  shipping: "/images/realistic/shipping-logistics.jpg",
  payment: "/images/realistic/secure-payment.jpg",
  returns: "/images/realistic/returns-package.jpg",
  security: "/images/realistic/cyber-security.jpg",
  support: "/images/realistic/customer-support.jpg",
  warranty: "/images/realistic/quality-control.jpg",
  global: "/images/realistic/global-commerce.jpg",
  dispatch: "/images/realistic/fast-dispatch.jpg",
} as const;

export type TrustVisualKey = keyof typeof TRUST_VISUALS;
