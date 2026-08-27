import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPublicCode, normalizePublicCode } from './codes.js';

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
        const session = { id: randomUUID(), publicCode, pairCode: normalizePublicCode(input.pairCode) || null, status: 'in_progress', startedAt: now, updatedAt: now, completedAt: null, answers: [], result: null };
        data.sessions.unshift(session); return session;
      });
    },
    async upsertAnswer(sessionId, answer) {
      return mutate((data) => {
        const session = data.sessions.find(({ id }) => id === sessionId); if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        const existing = session.answers.find(({ foodId }) => foodId === answer.foodId);
        const now = new Date().toISOString();
        const storedAnswer = { foodId: answer.foodId, choice: answer.choice };
        if (existing) Object.assign(existing, storedAnswer);
        else session.answers.push(storedAnswer);
        session.updatedAt = now; return session;
      });
    },
    async completeSession(sessionId, result) {
      return mutate((data) => { const session = data.sessions.find(({ id }) => id === sessionId); if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 }); const now = new Date().toISOString(); Object.assign(session, { status: 'completed', result, completedAt: now, updatedAt: now }); return session; });
    },
    async getSession(sessionId) { await writeQueue; const data = await load(); return structuredClone(data.sessions.find(({ id }) => id === sessionId) || null); },
    async getSessionByPublicCode(publicCode) { await writeQueue; const data = await load(); const code = normalizePublicCode(publicCode); return structuredClone(data.sessions.find((item) => item.publicCode === code) || null); },
    async getPairByHostCode(publicCode) { await writeQueue; const data = await load(); const code = normalizePublicCode(publicCode); const host = data.sessions.find((item) => item.publicCode === code); if (!host) return null; const guest = data.sessions.find((item) => item.pairCode === code && item.status === 'completed'); return { host: structuredClone(host), guest: structuredClone(guest || null) }; },
  };
}
