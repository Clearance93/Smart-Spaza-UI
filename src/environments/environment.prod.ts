export const environment = {
  production: true,
  /**
   * Same-origin path. The Node server (or your reverse proxy) forwards `/api`
   * to the deployed SmartSpazaAPI at http://smartspaza-api.runasp.net, which keeps
   * the browser on one origin and avoids mixed-content / CORS issues.
   */
  apiUrl: '/api',
  /** Public support number used by the driver portal quick-contact links. */
  supportWhatsApp: '+27761234567',
};
