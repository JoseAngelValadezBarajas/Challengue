export const DOCUMENT_ROUTES = {
  ROOT: "/",
  REDACTIONS: "/redactions",
  BY_ID: "/:id",
  BY_ID_REDACTIONS: "/:id/redactions",
  BY_ID_AUDIT_EVENTS: "/:id/audit-events",
  BY_ID_UNREDACTIONS: "/:id/unredactions",
} as const;
