import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPublicCode, normalizePublicCode } from './codes.js';
import { withEffectiveSessionStatus } from './session-status.js';

export function createArchiveRepository(filePath) {
  let writeQueue = Promise.resolve();
  async function load() {
    try { return JSON.parse(await readFile(filePath, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { sessions: [] }; throw error; }
  }
  async function save(data) {
    await mkdir(dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporary, filePath);
  }
  function mutate(fn) {
    const operation = writeQueue.then(async () => { const data = await load(); const result = await fn(data); await save(data); return structuredClone(result); });
    writeQueue = operation.catch(() => {});
    return operation;
  }
  return {
    async createSession(input) {
      return mutate((data) => {
        const now = new Date().toISOString();
        let publicCode; do { publicCode = createPublicCode(); } while (data.sessions.some((item) => item.publicCode === publicCode));
        const session = { id: randomUUID(), publicCode, pairCode: normalizePublicCode(input.pairCode) || null, visitorId: input.visitorId || randomUUID(), userId: null, ip: input.ip || '', userAgent: input.userAgent || '', device: input.device || {}, viewport: input.viewport || {}, language: input.language || '', timezone: input.timezone || '', referrer: input.referrer || '', status: 'in_progress', startedAt: now, updatedAt: now, completedAt: null, answers: [], result: null };
        data.sessions.unshift(session); return session;
      });
    },
    async upsertAnswer(sessionId, answer) {
      return mutate((data) => {
        const session = data.sessions.find(({ id }) => id === sessionId); if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        const existing = session.answers.find(({ foodId }) => foodId === answer.foodId);
        const now = new Date().toISOString();
        if (existing) Object.assign(existing, answer, { modifiedCount: (existing.modifiedCount || 0) + (existing.choice === answer.choice ? 0 : 1), updatedAt: now });
        else session.answers.push({ ...answer, modifiedCount: 0, answeredAt: now, updatedAt: now });
        session.updatedAt = now; return session;
      });
    },
    async completeSession(sessionId, result) {
      return mutate((data) => { const session = data.sessions.find(({ id }) => id === sessionId); if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 }); const now = new Date().toISOString(); Object.assign(session, { status: 'completed', result, completedAt: now, updatedAt: now }); return session; });
    },
    async ensurePublicCode(sessionId) {
      return mutate((data) => {
        const session = data.sessions.find(({ id }) => id === sessionId); if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        if (!session.publicCode) { let publicCode; do { publicCode = createPublicCode(); } while (data.sessions.some((item) => item.publicCode === publicCode)); session.publicCode = publicCode; }
        return session;
      });
    },
    async getSession(sessionId) { await writeQueue; const data = await load(); return structuredClone(data.sessions.find(({ id }) => id === sessionId) || null); },
    async getSessionByPublicCode(publicCode) { await writeQueue; const data = await load(); const code = normalizePublicCode(publicCode); return structuredClone(data.sessions.find((item) => item.publicCode === code) || null); },
    async getPairByHostCode(publicCode) { await writeQueue; const data = await load(); const code = normalizePublicCode(publicCode); const host = data.sessions.find((item) => item.publicCode === code); if (!host) return null; const guest = data.sessions.find((item) => item.pairCode === code && item.status === 'completed'); return { host: structuredClone(host), guest: structuredClone(guest || null) }; },
    async recordMatch(input) {
      return mutate((data) => {
        data.matches ||= [];
        const firstCode = normalizePublicCode(input.firstCode); const secondCode = normalizePublicCode(input.secondCode);
        const existing = data.matches.find((item) => (item.firstCode === firstCode && item.secondCode === secondCode) || (item.firstCode === secondCode && item.secondCode === firstCode));
        const now = new Date().toISOString();
        if (existing) { existing.lastViewedAt = now; existing.viewCount = (existing.viewCount || 1) + 1; return existing; }
        const first = data.sessions.find((item) => item.publicCode === firstCode); const second = data.sessions.find((item) => item.publicCode === secondCode);
        const match = { id: randomUUID(), firstCode, secondCode, firstSessionId: first?.id || null, secondSessionId: second?.id || null, score: Number(input.score || 0), verdict: input.verdict || '', overlapCount: Number(input.overlapCount || 0), sharedLikeIds: (input.sharedLikes || []).map((food) => food.id), sharedAvoidIds: (input.sharedAvoids || []).map((food) => food.id), conflictIds: (input.conflicts || []).map((food) => food.id), source: input.source || 'direct', ip: input.ip || '', userAgent: input.userAgent || '', device: input.device || {}, createdAt: now, lastViewedAt: now, viewCount: 1 };
        data.matches.unshift(match); return match;
      });
    },
    async listMatches({ query = '', page = 1, pageSize = 50 } = {}) {
      await writeQueue; const data = await load(); let items = data.matches || [];
      if (query) { const needle = query.toLowerCase(); items = items.filter((item) => [item.id, item.firstCode, item.secondCode, item.ip].some((value) => String(value || '').toLowerCase().includes(needle))); }
      const total = items.length; const start = (Math.max(1, page) - 1) * pageSize; return { items: structuredClone(items.slice(start, start + pageSize)), total, page, pageSize };
    },
    async listSessions({ status, personality, query = '', page = 1, pageSize = 50 } = {}) {
      await writeQueue; const data = await load(); let items = data.sessions.map((item) => withEffectiveSessionStatus(item));
      if (status) items = items.filter((item) => item.status === status);
      if (personality) items = items.filter((item) => item.result?.personality?.id === personality);
      if (query) { const needle = query.toLowerCase(); items = items.filter((item) => [item.id, item.publicCode, item.pairCode, item.visitorId, item.userId, item.ip].some((value) => String(value || '').toLowerCase().includes(needle))); }
      const total = items.length; const start = (Math.max(1, page) - 1) * pageSize; return { items: structuredClone(items.slice(start, start + pageSize)), total, page, pageSize };
    },
    async summary() {
      await writeQueue; const data = await load(); const matches = data.matches || []; const sessions = data.sessions.map((item) => withEffectiveSessionStatus(item)); const completed = sessions.filter((item) => item.status === 'completed'); const abandoned = sessions.filter((item) => item.status === 'abandoned');
      const answerCounts = { love: 0, okay: 0, refuse: 0, unknown: 0 }; sessions.flatMap((item) => item.answers).forEach(({ choice }) => { if (choice in answerCounts) answerCounts[choice]++; });
      const personalityCounts = {}; completed.forEach(({ result }) => { const name = result?.personality?.name || '未知'; personalityCounts[name] = (personalityCounts[name] || 0) + 1; });
      const completedDurations = completed.map((item) => new Date(item.completedAt) - new Date(item.startedAt)).filter((value) => value >= 0);
      return { started: sessions.length, completed: completed.length, abandoned: abandoned.length, inProgress: sessions.length - completed.length - abandoned.length, matches: matches.length, completionRate: sessions.length ? completed.length / sessions.length : 0, averageQuestions: completed.length ? completed.reduce((sum, item) => sum + item.answers.length, 0) / completed.length : 0, averageDurationMs: completedDurations.length ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length : 0, answerCounts, personalityCounts };
    },
  };
}
