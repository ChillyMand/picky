export function parseDevice(userAgent = '') {
  const ua = String(userAgent);
  const mobile = /Mobile|iPhone|Android/i.test(ua);
  const type = /iPad|Tablet/i.test(ua) ? 'tablet' : mobile ? 'mobile' : 'desktop';
  const os = /iPhone|iPad/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X|Macintosh/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown';
  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  const model = /iPhone/i.test(ua) ? 'iPhone' : /iPad/i.test(ua) ? 'iPad' : (ua.match(/Android[^;]*;\s*([^;)]+)[;)]/i)?.[1]?.trim() || 'Unknown');
  return { type, os, browser, model };
}
