# Security Implementation

<cite>
**Referenced Files in This Document**
- [supabase.ts](file://src/lib/supabase.ts)
- [supabase-admin.ts](file://src/lib/supabase-admin.ts)
- [csrf.ts](file://src/lib/csrf.ts)
- [rate-limit.ts](file://src/lib/rate-limit.ts)
- [ip-block.ts](file://src/lib/ip-block.ts)
- [vpn-detect.ts](file://src/lib/vpn-detect.ts)
- [order-token.ts](file://src/lib/order-token.ts)
- [validation.ts](file://src/lib/validation.ts)
- [20260311_security_performance_fixes.sql](file://supabase/migrations/20260311_security_performance_fixes.sql)
- [schema.sql](file://schema.sql)
- [full_database_update.sql](file://full_database_update.sql)
- [db.ts](file://src/lib/db.ts)
- [block-ip route.ts](file://src/app/api/admin/block-ip/route.ts)
- [csrf route.ts](file://src/app/api/internal/csrf/route.ts)
- [catalog-admin-auth.ts](file://src/lib/catalog-admin-auth.ts)
- [checkout-idempotency.ts](file://src/lib/checkout-idempotency.ts)
- [logistics webhook route.ts](file://src/app/api/webhooks/logistics/route.ts)
- [whatsapp webhook route.ts](file://src/app/api/webhooks/whatsapp/route.ts)
- [orders-control route.ts](file://src/app/api/internal/orders/control/route.ts)
- [catalog-control route.ts](file://src/app/api/internal/catalog/control/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains AllShop’s comprehensive security implementation for a secure ecommerce platform. It covers authentication and authorization for admin endpoints, signed tokens for order lookups, CSRF protection, rate limiting, IP blocking, VPN detection, duplicate order prevention, database security with row-level security policies, input validation, and XSS prevention. It also documents relationships with Supabase authentication, security headers configuration, monitoring, and incident response procedures.

## Project Structure
Security-related code is organized across:
- Supabase clients for public and admin operations
- API routes for admin controls and internal utilities
- Utility libraries for CSRF, rate limiting, IP blocking, VPN detection, order tokens, validation, and idempotency
- Database schema and migration files enabling row-level security and auxiliary tables for rate limiting and IP blocking

```mermaid
graph TB
subgraph "Frontend"
UI["Next.js App Router"]
end
subgraph "Server"
CSRF_ROUTE["/api/internal/csrf"]
BLOCK_IP_ROUTE["/api/admin/block-ip"]
ORDERS_CTRL_ROUTE["/api/internal/orders/control"]
CATALOG_CTRL_ROUTE["/api/internal/catalog/control"]
end
subgraph "Utilities"
CSRF_LIB["CSRF Utilities"]
RL_LIB["Rate Limit"]
IP_LIB["IP Block"]
VPN_LIB["VPN Detection"]
ORDER_TOKEN_LIB["Order Token"]
VALIDATION_LIB["Validation"]
IDMP_LIB["Checkout Idempotency"]
end
subgraph "Supabase"
SUPA_PUBLIC["Public Client"]
SUPA_ADMIN["Admin Client"]
DB_SCHEMA["Database Schema + RLS"]
end
UI --> CSRF_ROUTE
UI --> BLOCK_IP_ROUTE
UI --> ORDERS_CTRL_ROUTE
UI --> CATALOG_CTRL_ROUTE
CSRF_ROUTE --> CSRF_LIB
BLOCK_IP_ROUTE --> IP_LIB
ORDERS_CTRL_ROUTE --> ORDERS_CTRL_ROUTE
CATALOG_CTRL_ROUTE --> CATALOG_CTRL_ROUTE
CSRF_LIB --> SUPA_PUBLIC
RL_LIB --> SUPA_ADMIN
IP_LIB --> SUPA_ADMIN
VPN_LIB --> VPN_LIB
ORDER_TOKEN_LIB --> ORDER_TOKEN_LIB
VALIDATION_LIB --> VALIDATION_LIB
IDMP_LIB --> IDMP_LIB
CSRF_LIB --> DB_SCHEMA
RL_LIB --> DB_SCHEMA
IP_LIB --> DB_SCHEMA
ORDER_TOKEN_LIB --> DB_SCHEMA
VALIDATION_LIB --> DB_SCHEMA
IDMP_LIB --> DB_SCHEMA
SUPA_PUBLIC --> DB_SCHEMA
SUPA_ADMIN --> DB_SCHEMA
```

**Diagram sources**
- [csrf route.ts:1-35](file://src/app/api/internal/csrf/route.ts#L1-L35)
- [block-ip route.ts:1-140](file://src/app/api/admin/block-ip/route.ts#L1-L140)
- [orders-control route.ts:1-664](file://src/app/api/internal/orders/control/route.ts#L1-L664)
- [catalog-control route.ts:1-191](file://src/app/api/internal/catalog/control/route.ts#L1-L191)
- [csrf.ts:1-119](file://src/lib/csrf.ts#L1-L119)
- [rate-limit.ts:1-165](file://src/lib/rate-limit.ts#L1-L165)
- [ip-block.ts:1-210](file://src/lib/ip-block.ts#L1-L210)
- [vpn-detect.ts:1-101](file://src/lib/vpn-detect.ts#L1-L101)
- [order-token.ts:1-65](file://src/lib/order-token.ts#L1-L65)
- [validation.ts:1-112](file://src/lib/validation.ts#L1-L112)
- [checkout-idempotency.ts:1-33](file://src/lib/checkout-idempotency.ts#L1-L33)
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)
- [schema.sql:1-230](file://schema.sql#L1-L230)
- [20260311_security_performance_fixes.sql:1-86](file://supabase/migrations/20260311_security_performance_fixes.sql#L1-L86)

**Section sources**
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)
- [csrf.ts:1-119](file://src/lib/csrf.ts#L1-L119)
- [rate-limit.ts:1-165](file://src/lib/rate-limit.ts#L1-L165)
- [ip-block.ts:1-210](file://src/lib/ip-block.ts#L1-L210)
- [vpn-detect.ts:1-101](file://src/lib/vpn-detect.ts#L1-L101)
- [order-token.ts:1-65](file://src/lib/order-token.ts#L1-L65)
- [validation.ts:1-112](file://src/lib/validation.ts#L1-L112)
- [checkout-idempotency.ts:1-33](file://src/lib/checkout-idempotency.ts#L1-L33)
- [schema.sql:180-220](file://schema.sql#L180-L220)
- [20260311_security_performance_fixes.sql:22-86](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L86)

## Core Components
- Supabase public client for frontend-safe operations
- Supabase admin client for server-only privileged operations
- CSRF utilities for token generation and validation, plus same-origin checks
- Rate limiting with in-memory and DB-backed enforcement
- IP blocking system backed by a dedicated table with RLS
- VPN/Proxy detection using heuristics and optional API
- Signed order lookup tokens with TTL and safe comparison
- Input validation for checkout forms
- Duplicate order prevention via idempotency keys and database constraints
- Admin authentication via environment-controlled secrets and bearer tokens

**Section sources**
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)
- [csrf.ts:1-119](file://src/lib/csrf.ts#L1-L119)
- [rate-limit.ts:1-165](file://src/lib/rate-limit.ts#L1-L165)
- [ip-block.ts:1-210](file://src/lib/ip-block.ts#L1-L210)
- [vpn-detect.ts:1-101](file://src/lib/vpn-detect.ts#L1-L101)
- [order-token.ts:1-65](file://src/lib/order-token.ts#L1-L65)
- [validation.ts:1-112](file://src/lib/validation.ts#L1-L112)
- [checkout-idempotency.ts:1-33](file://src/lib/checkout-idempotency.ts#L1-L33)
- [20260311_security_performance_fixes.sql:22-86](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L86)

## Architecture Overview
The security architecture separates concerns:
- Public client for read-only storefront operations with RLS
- Admin client for privileged operations (orders, catalog, IP/block management)
- Internal admin endpoints protected by environment-controlled secrets
- Rate limiting layered on top of Supabase for critical paths
- IP blocklist and rate limits persisted in Supabase with RLS enforced
- VPN detection as a supplementary measure with fail-open behavior

```mermaid
sequenceDiagram
participant Client as "Client"
participant CSRFRoute as "/api/internal/csrf"
participant CSRFUtil as "CSRF Utils"
participant SupaPub as "Supabase Public Client"
Client->>CSRFRoute : GET /api/internal/csrf
CSRFRoute->>CSRFUtil : generateCsrfToken()
CSRFUtil-->>CSRFRoute : token
CSRFRoute-->>Client : {csrfToken}
Note over Client,SupaPub : Frontend uses token for protected actions
```

**Diagram sources**
- [csrf route.ts:1-35](file://src/app/api/internal/csrf/route.ts#L1-L35)
- [csrf.ts:40-51](file://src/lib/csrf.ts#L40-L51)
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)

```mermaid
sequenceDiagram
participant Admin as "Admin Client"
participant BlockRoute as "/api/admin/block-ip"
participant Auth as "Admin Auth"
participant IPLib as "IP Block"
participant SupaAdmin as "Supabase Admin Client"
Admin->>BlockRoute : POST /api/admin/block-ip {Authorization : Bearer}
BlockRoute->>Auth : isAdminActionSecretValid()
Auth-->>BlockRoute : valid?
alt authorized
BlockRoute->>IPLib : blockIp(ip, duration)
IPLib->>SupaAdmin : upsert blocked_ips
SupaAdmin-->>IPLib : ok
BlockRoute-->>Admin : success
else unauthorized
BlockRoute-->>Admin : 401 Unauthorized
end
```

**Diagram sources**
- [block-ip route.ts:1-140](file://src/app/api/admin/block-ip/route.ts#L1-L140)
- [catalog-admin-auth.ts:27-64](file://src/lib/catalog-admin-auth.ts#L27-L64)
- [ip-block.ts:103-132](file://src/lib/ip-block.ts#L103-L132)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)

## Detailed Component Analysis

### Authentication and Authorization
- Admin endpoints require a bearer token derived from environment secrets. The system supports a primary secret for admin actions and a fallback to an order-lookup secret.
- Admin access codes are validated securely using constant-time comparison for the private admin panel.
- Supabase service role key enables privileged operations server-side, bypassing RLS.

```mermaid
flowchart TD
Start(["Admin Request"]) --> ParseBearer["Parse Bearer Token"]
ParseBearer --> CheckSecret{"isAdminActionSecretValid()"}
CheckSecret --> |No| Deny["401 Unauthorized"]
CheckSecret --> |Yes| Proceed["Proceed to Endpoint Logic"]
subgraph "Admin Panel Access"
XHeader["X-Catalog-Admin-Code Header"]
CodeValid{"isCatalogAdminCodeValid()"}
XHeader --> CodeValid
CodeValid --> |No| Deny
CodeValid --> |Yes| Proceed
end
```

**Diagram sources**
- [block-ip route.ts:20-41](file://src/app/api/admin/block-ip/route.ts#L20-L41)
- [orders-control route.ts:55-79](file://src/app/api/internal/orders/control/route.ts#L55-L79)
- [catalog-control route.ts:24-79](file://src/app/api/internal/catalog/control/route.ts#L24-L79)
- [catalog-admin-auth.ts:27-64](file://src/lib/catalog-admin-auth.ts#L27-L64)

**Section sources**
- [block-ip route.ts:20-41](file://src/app/api/admin/block-ip/route.ts#L20-L41)
- [orders-control route.ts:55-79](file://src/app/api/internal/orders/control/route.ts#L55-L79)
- [catalog-control route.ts:24-79](file://src/app/api/internal/catalog/control/route.ts#L24-L79)
- [catalog-admin-auth.ts:1-65](file://src/lib/catalog-admin-auth.ts#L1-L65)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)

### CSRF Protection
- Tokens are generated server-side with HMAC-SHA256 using a configurable secret, falling back to an order-lookup secret if needed.
- Tokens include a timestamp and random part, signed with a fixed-length signature, and validated with constant-time comparison.
- Same-origin validation checks Origin and Referer headers against the host, with a strict policy in production.

```mermaid
flowchart TD
GenStart["Generate CSRF Token"] --> GetSecret["getCsrfSecret()"]
GetSecret --> BuildPayload["timestamp.random"]
BuildPayload --> Sign["HMAC-SHA256(secret, payload)"]
Sign --> Concat["<timestamp.random.signature>"]
ValStart["Validate CSRF Token"] --> Split["Split by '.'"]
Split --> VerifySig["HMAC-SHA256(secret, payload) == signature?"]
VerifySig --> CheckAge{"Within validity window?"}
CheckAge --> |No| Reject["Reject"]
CheckAge --> |Yes| Accept["Accept"]
```

**Diagram sources**
- [csrf.ts:19-84](file://src/lib/csrf.ts#L19-L84)

**Section sources**
- [csrf.ts:1-119](file://src/lib/csrf.ts#L1-L119)
- [csrf route.ts:1-35](file://src/app/api/internal/csrf/route.ts#L1-L35)

### Signed Tokens for Order Lookup
- Order lookup tokens are signed with a secret and include an expiration timestamp.
- Validation uses constant-time comparison and ensures the token is not expired.
- Environment variable controls the TTL with strict bounds.

```mermaid
flowchart TD
Create["createOrderLookupToken(orderId)"] --> Exp["Compute exp from TTL"]
Exp --> Payload["Build payload orderId.exp"]
Payload --> Sign["HMAC-SHA256(secret, payload)"]
Sign --> Token["<exp.signature>"]
Verify["verifyOrderLookupToken(orderId, token)"] --> Split["Split exp.signature"]
Split --> CheckExp{"exp > now?"}
CheckExp --> |No| Invalid["Invalid"]
CheckExp --> |Yes| Compare["Constant-time HMAC compare"]
Compare --> |Mismatch| Invalid
Compare --> |Match| Valid["Valid"]
```

**Diagram sources**
- [order-token.ts:39-64](file://src/lib/order-token.ts#L39-L64)

**Section sources**
- [order-token.ts:1-65](file://src/lib/order-token.ts#L1-L65)

### Rate Limiting Strategies
- In-memory rate limiter provides best-effort protection per instance.
- DB-backed rate limiter uses Supabase for critical paths (checkout), with automatic fallback to in-memory if Supabase is unavailable or tables are missing.
- Supabase tables for rate limits enable cross-instance enforcement in serverless environments.

```mermaid
flowchart TD
Req["Incoming Request"] --> MemCheck["checkRateLimit(memory)"]
MemCheck --> Allowed{"allowed?"}
Allowed --> |No| Block["429 Too Many Requests"]
Allowed --> |Yes| DBCheck["checkRateLimitDb(Supabase)"]
DBCheck --> DBAllowed{"allowed?"}
DBAllowed --> |No| Retry["Return retry-after"]
DBAllowed --> |Yes| Proceed["Proceed"]
```

**Diagram sources**
- [rate-limit.ts:43-164](file://src/lib/rate-limit.ts#L43-L164)
- [20260311_security_performance_fixes.sql:48-71](file://supabase/migrations/20260311_security_performance_fixes.sql#L48-L71)

**Section sources**
- [rate-limit.ts:1-165](file://src/lib/rate-limit.ts#L1-L165)
- [20260311_security_performance_fixes.sql:48-71](file://supabase/migrations/20260311_security_performance_fixes.sql#L48-L71)

### IP Blocking System
- Supabase-backed IP blocklist with RLS denying client access.
- In-memory cache accelerates lookups; DB verification ensures consistency across serverless instances.
- Supports permanent, 24-hour, and 1-hour durations with asynchronous persistence.

```mermaid
flowchart TD
Check["isIpBlockedAsync(ip)"] --> Mem["Memory cache hit?"]
Mem --> |Yes| Expired{"Expired?"}
Expired --> |Yes| Remove["Delete from cache"] --> DB["Check DB"]
Expired --> |No| Allow["Block"]
Mem --> |No| DB["Check DB"]
DB --> Found{"Found and not expired?"}
Found --> |Yes| Cache["Cache entry"] --> Allow
Found --> |No| Allow["Allow"]
```

**Diagram sources**
- [ip-block.ts:25-72](file://src/lib/ip-block.ts#L25-L72)
- [20260311_security_performance_fixes.sql:22-46](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L46)

**Section sources**
- [ip-block.ts:1-210](file://src/lib/ip-block.ts#L1-L210)
- [20260311_security_performance_fixes.sql:22-46](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L46)

### VPN Detection
- Heuristic checks analyze forwarded-for chains and header patterns.
- Optional API check via a third-party service with a fail-open policy.
- Designed as a supplementary control, not a security boundary.

```mermaid
flowchart TD
Start["Incoming Request"] --> Heuristic["checkVpnHeuristics(headers)"]
Heuristic --> Found{"VPN/Proxy detected?"}
Found --> |Yes| Report["Report reason"]
Found --> |No| ApiCheck["checkVpnByApi(ip)"]
ApiCheck --> ApiFound{"VPN/Proxy detected?"}
ApiFound --> |Yes| Report
ApiFound --> |No| Allow["Allow"]
```

**Diagram sources**
- [vpn-detect.ts:22-100](file://src/lib/vpn-detect.ts#L22-L100)

**Section sources**
- [vpn-detect.ts:1-101](file://src/lib/vpn-detect.ts#L1-L101)

### Duplicate Order Prevention
- Idempotency keys are normalized and hashed to prevent duplicates.
- Database constraints enforce uniqueness of payment identifiers to avoid duplicate orders.
- Helper utilities detect duplicate payment ID errors and handle them gracefully.

```mermaid
flowchart TD
Submit["Checkout Request"] --> Normalize["normalizeCheckoutIdempotencyKey()"]
Normalize --> Hash["hashCheckoutPayload()"]
Hash --> BuildId["toCheckoutPaymentId()"]
BuildId --> Insert["Insert order with payment_id"]
Insert --> Conflict{"Unique violation?"}
Conflict --> |Yes| Detect["isDuplicateOrderPaymentIdError()"]
Detect --> Handle["Return duplicate error response"]
Conflict --> |No| Success["Success"]
```

**Diagram sources**
- [checkout-idempotency.ts:5-32](file://src/lib/checkout-idempotency.ts#L5-L32)
- [full_database_update.sql:160-165](file://full_database_update.sql#L160-L165)

**Section sources**
- [checkout-idempotency.ts:1-33](file://src/lib/checkout-idempotency.ts#L1-L33)
- [full_database_update.sql:160-165](file://full_database_update.sql#L160-L165)

### Database Security and Row-Level Security
- RLS enabled on sensitive tables (orders, fulfillment logs, catalog runtime state, blocked_ips, catalog audit logs).
- Policies deny client access to admin-only tables; service role bypasses RLS for server-side operations.
- Additional indexes optimize secure queries and cleanup of expired records.

```mermaid
erDiagram
ORDERS {
uuid id PK
string customer_email
string status
jsonb items
timestamptz created_at
timestamptz updated_at
}
CATEGORIES {
uuid id PK
string slug UK
string name
timestamptz created_at
}
PRODUCTS {
uuid id PK
string slug UK
integer price
boolean is_active
uuid category_id FK
timestamptz created_at
timestamptz updated_at
}
PRODUCT_REVIEWS {
uuid id PK
uuid product_id FK
uuid order_id FK
boolean is_approved
boolean is_verified_purchase
timestamptz created_at
timestamptz updated_at
}
BLOCKED_IPS {
varchar ip PK
varchar duration
text reason
timestamptz blocked_at
timestamptz expires_at
}
RATE_LIMITS {
text key PK
integer count
timestamptz reset_at
}
CATALOG_RUNTIME_STATE {
varchar product_slug PK
integer total_stock
jsonb variants
timestamptz updated_at
}
CATALOG_AUDIT_LOGS {
uuid id PK
varchar product_slug
varchar changed_by
varchar change_type
jsonb previous_state
jsonb next_state
timestamptz created_at
}
PRODUCTS }o--|| CATEGORIES : "belongs to"
PRODUCT_REVIEWS }o--|| PRODUCTS : "references"
PRODUCT_REVIEWS }o--|| ORDERS : "references"
CATALOG_RUNTIME_STATE }o--|| PRODUCTS : "references"
```

**Diagram sources**
- [schema.sql:50-128](file://schema.sql#L50-L128)
- [20260311_security_performance_fixes.sql:22-86](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L86)

**Section sources**
- [schema.sql:180-220](file://schema.sql#L180-L220)
- [20260311_security_performance_fixes.sql:22-86](file://supabase/migrations/20260311_security_performance_fixes.sql#L22-L86)

### Input Validation and XSS Prevention
- Form validation enforces strong constraints on checkout fields with localized error messages.
- Output sanitization and template rendering should escape HTML in views; ensure frontend components do not dangerously set innerHTML from untrusted data.

```mermaid
flowchart TD
Input["User Input"] --> Validate["validateField(field, value)"]
Validate --> Errors{"Errors found?"}
Errors --> |Yes| ReturnErr["Return localized error"]
Errors --> |No| Sanitized["Sanitized value"]
Sanitized --> Store["Store or render safely"]
```

**Diagram sources**
- [validation.ts:14-110](file://src/lib/validation.ts#L14-L110)

**Section sources**
- [validation.ts:1-112](file://src/lib/validation.ts#L1-L112)

### Admin Endpoint Security
- Admin endpoints for blocking/unblocking IPs and managing orders/catalog require bearer tokens and admin codes.
- Rate limiting protects admin endpoints from abuse.
- Webhooks for logistics and WhatsApp are disabled to reduce attack surface.

```mermaid
sequenceDiagram
participant Client as "Admin Client"
participant OrdersCtrl as "/api/internal/orders/control"
participant Auth as "Admin Auth"
participant SupaAdmin as "Supabase Admin Client"
Client->>OrdersCtrl : PATCH /api/internal/orders/control
OrdersCtrl->>Auth : isCatalogAdminCodeValid()
Auth-->>OrdersCtrl : valid?
alt authorized
OrdersCtrl->>SupaAdmin : update orders
SupaAdmin-->>OrdersCtrl : ok
OrdersCtrl-->>Client : updated order
else unauthorized
OrdersCtrl-->>Client : 401 Unauthorized
end
```

**Diagram sources**
- [orders-control route.ts:349-417](file://src/app/api/internal/orders/control/route.ts#L349-L417)
- [orders-control route.ts:55-79](file://src/app/api/internal/orders/control/route.ts#L55-L79)
- [catalog-admin-auth.ts:41-55](file://src/lib/catalog-admin-auth.ts#L41-L55)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)

**Section sources**
- [block-ip route.ts:51-129](file://src/app/api/admin/block-ip/route.ts#L51-L129)
- [orders-control route.ts:283-347](file://src/app/api/internal/orders/control/route.ts#L283-L347)
- [catalog-control route.ts:81-104](file://src/app/api/internal/catalog/control/route.ts#L81-L104)
- [logistics webhook route.ts:1-19](file://src/app/api/webhooks/logistics/route.ts#L1-L19)
- [whatsapp webhook route.ts:1-19](file://src/app/api/webhooks/whatsapp/route.ts#L1-L19)

## Dependency Analysis
- Supabase public client depends on environment variables for URL and anonymous key; safe defaults are used when not configured.
- Supabase admin client depends on service role key; auto-refresh and persistence are disabled for server-side use.
- Admin routes depend on admin authentication utilities and Supabase admin client.
- IP blocking and rate limiting depend on Supabase admin client for persistence.
- VPN detection optionally depends on an external API.

```mermaid
graph LR
CSRF["CSRF Utils"] --> SUPA_PUB["Supabase Public"]
RL["Rate Limit"] --> SUPA_ADMIN["Supabase Admin"]
IP["IP Block"] --> SUPA_ADMIN
ORDERS_CTRL["Orders Control Route"] --> AUTH["Admin Auth"]
ORDERS_CTRL --> SUPA_ADMIN
BLOCK_IP["Block IP Route"] --> AUTH
BLOCK_IP --> IP
VPN["VPN Detection"] --> VPN
```

**Diagram sources**
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)
- [csrf.ts:1-119](file://src/lib/csrf.ts#L1-L119)
- [rate-limit.ts:1-165](file://src/lib/rate-limit.ts#L1-L165)
- [ip-block.ts:1-210](file://src/lib/ip-block.ts#L1-L210)
- [orders-control route.ts:1-664](file://src/app/api/internal/orders/control/route.ts#L1-L664)
- [block-ip route.ts:1-140](file://src/app/api/admin/block-ip/route.ts#L1-L140)
- [catalog-admin-auth.ts:1-65](file://src/lib/catalog-admin-auth.ts#L1-L65)
- [vpn-detect.ts:1-101](file://src/lib/vpn-detect.ts#L1-L101)

**Section sources**
- [supabase.ts:1-20](file://src/lib/supabase.ts#L1-L20)
- [supabase-admin.ts:1-31](file://src/lib/supabase-admin.ts#L1-L31)
- [catalog-admin-auth.ts:1-65](file://src/lib/catalog-admin-auth.ts#L1-L65)
- [orders-control route.ts:1-664](file://src/app/api/internal/orders/control/route.ts#L1-L664)
- [block-ip route.ts:1-140](file://src/app/api/admin/block-ip/route.ts#L1-L140)

## Performance Considerations
- In-memory rate limiting is best-effort in serverless; DB-backed limits provide stronger guarantees for critical paths.
- IP blocklist uses an in-memory cache synchronized with Supabase to minimize DB calls while ensuring correctness across instances.
- VPN detection uses zero-latency heuristics and optional API calls with timeouts to avoid impacting latency.
- Database indexes improve query performance for active products, order status filtering, and cleanup of expired records.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing CSRF secret in production: Ensure CSRF_SECRET or ORDER_LOOKUP_SECRET is configured; otherwise token generation fails.
- Admin endpoint 401 Unauthorized: Verify ADMIN_BLOCK_SECRET or ORDER_LOOKUP_SECRET matches the Authorization header; ensure CATALOG_ADMIN_ACCESS_CODE is set for the admin panel.
- IP blocking not effective: Confirm Supabase admin is configured and blocked_ips table exists with RLS policies applied.
- Rate limit not working: Ensure Supabase admin is configured; if DB table does not exist, fallback to in-memory only.
- Duplicate order errors: Check idempotency key normalization and database unique constraint on payment_id.

**Section sources**
- [csrf route.ts:7-15](file://src/app/api/internal/csrf/route.ts#L7-L15)
- [block-ip route.ts:25-41](file://src/app/api/admin/block-ip/route.ts#L25-L41)
- [orders-control route.ts:55-79](file://src/app/api/internal/orders/control/route.ts#L55-L79)
- [ip-block.ts:37-72](file://src/lib/ip-block.ts#L37-L72)
- [rate-limit.ts:111-112](file://src/lib/rate-limit.ts#L111-L112)
- [checkout-idempotency.ts:23-32](file://src/lib/checkout-idempotency.ts#L23-L32)

## Conclusion
AllShop’s security model combines Supabase RLS, server-side admin clients, environment-controlled secrets, and layered protections (rate limiting, IP blocking, VPN detection, CSRF, signed tokens, and input validation). These measures collectively mitigate common threats such as brute force, injection attempts, session hijacking, and abuse of administrative endpoints while maintaining a robust, scalable ecommerce platform.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Security Headers Configuration
- Configure security headers at the CDN or edge level (e.g., Content-Security-Policy, Strict-Transport-Security, Referrer-Policy) to complement client-side protections.
- Ensure cookies are marked as Secure, HttpOnly, and SameSite appropriate to your deployment.

[No sources needed since this section provides general guidance]

### Monitoring and Audit Logging
- Use Supabase audit logs for catalog changes and integrate with external logging systems.
- Monitor admin endpoint access, rate limit triggers, and IP block events.
- Alert on repeated failures, unusual spikes, and policy violations.

[No sources needed since this section provides general guidance]

### Incident Response Procedures
- Immediately revoke compromised secrets and rotate keys.
- Review Supabase audit logs and admin activity.
- Temporarily disable affected endpoints and apply stricter rate limits.
- Notify stakeholders and document remediation steps.

[No sources needed since this section provides general guidance]