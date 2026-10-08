/** Original Hostbrid URL preflight. No network or source-file scanning. */
export function check(reference, base) {
  let url;
  try { url = new URL(reference, base); } catch { return {status: 'INVALID_URL'}; }
  if (!['http:', 'https:'].includes(url.protocol)) return {status: 'NON_HTTP'};
  if (url.username || url.password) return {status: 'CREDENTIALS_IN_URL'};
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(host)) return {status: 'LOOPBACK_TARGET'};
  if (host === '0.0.0.0' || host === '[::]') return {status: 'UNSPECIFIED_TARGET'};
  const sameOrigin = base ? url.origin === new URL(base).origin : null;
  return {status: 'REVIEW_HTTP_TARGET', sameOrigin, secureScheme: url.protocol === 'https:'};
}
