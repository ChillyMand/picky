export const ABANDON_AFTER_MS = 5 * 60 * 1000;

export function effectiveSessionStatus(session, now = Date.now()) {
  if (session?.status === 'completed') return 'completed';
  const lastActivity = Date.parse(session?.updatedAt || session?.startedAt || '');
  if (!Number.isFinite(lastActivity)) return 'in_progress';
  return Number(now) - lastActivity >= ABANDON_AFTER_MS ? 'abandoned' : 'in_progress';
}

export function withEffectiveSessionStatus(session, now = Date.now()) {
  return { ...session, status: effectiveSessionStatus(session, now) };
}
