/**
 * Cookie name only, in its own module with no server-only import, so that
 * middleware (which runs outside the Node server context) can share the
 * constant with the server helpers in admin-session.ts.
 */
export const SESSION_COOKIE = 'mh_admin';
