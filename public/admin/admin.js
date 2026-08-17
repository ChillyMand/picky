import { getFoodById } from '/modules/foods.js';
import { formatDateTime } from '/modules/format.js';

const $ = (selector) => document.querySelector(selector);
let sessions = [];
const choiceNames = { love: '😋 超爱吃', okay: '🙂 可以吃', refuse: '😖 坚决不吃', unknown: '❓ 没吃过' };
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function duration(ms) { const seconds = Math.round(ms / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

async function loadSummary() {
  const summary = await fetch('/api/admin/summary').then((response) => response.json());
  $('#kpi-started').textContent = summary.started; $('#kpi-rate').textContent = `${Math.round(summary.completionRate * 100)}%`; $('#kpi-completed').textContent = `${summary.completed} 次完成`; $('#kpi-questions').textContent = summary.averageQuestions.toFixed(1); $('#kpi-duration').textContent = duration(summary.averageDurationMs);
  const total = Object.values(summary.answerCounts).reduce((a, b) => a + b, 0); $('#answer-total').textContent = `${total} 次选择`;
  $('#answer-bar').innerHTML = Object.entries(summary.answerCounts).map(([, count]) => `<i style="width:${total ? count / total * 100 : 0}%"></i>`).join('');
  $('#answer-legend').innerHTML = Object.entries(summary.answerCounts).map(([key, count]) => `<span>${choiceNames[key]} ${total ? Math.round(count / total * 100) : 0}%</span>`).join('');
  const personalities = Object.entries(summary.personalityCounts); const max = Math.max(1, ...personalities.map(([, count]) => count));
  $('#personality-list').innerHTML = personalities.length ? personalities.map(([name, count]) => `<div class="personality-item"><div>${escapeHtml(name)} <b>${count}</b></div><span><i style="width:${count / max * 100}%"></i></span></div>`).join('') : '<p style="color:#756d63">完成测试后会在这里显示分布。</p>';
}

async function loadSessions() {
  const params = new URLSearchParams(); if ($('#status-filter').value) params.set('status', $('#status-filter').value); if ($('#search').value.trim()) params.set('q', $('#search').value.trim());
  const data = await fetch(`/api/admin/sessions?${params}`).then((response) => response.json()); sessions = data.items;
  $('#empty').hidden = sessions.length > 0; $('#session-rows').innerHTML = sessions.map((session) => `<tr data-id="${session.id}"><td>${formatDateTime(session.startedAt)}</td><td><code>${escapeHtml(session.publicCode || session.id.slice(0, 8))}</code></td><td>${session.result ? `<span class="score">${session.result.pickyScore}</span> ${escapeHtml(session.result.personality.name)}` : '未生成结果'}</td><td>${escapeHtml(session.ip || '--')} · ${escapeHtml(session.device?.model || session.device?.type || '未知')} · ${escapeHtml(session.device?.browser || '未知')}</td><td>${session.answers.length}</td><td><span class="status ${session.status}">${session.status === 'completed' ? '已完成' : '进行中'}</span></td></tr>`).join('');
}

async function openDetail(id) {
  const session = await fetch(`/api/admin/sessions/${id}`).then((response) => response.json());
  const result = session.result;
  $('#drawer-content').innerHTML = `<p class="eyebrow">SESSION DETAIL</p><h2>${result ? escapeHtml(result.personality.name) : '未完成测试'}</h2><div class="detail-grid"><div class="detail-box"><small>测试 ID / 配对码</small><b>${escapeHtml(session.publicCode || '--')}</b></div><div class="detail-box"><small>加入的配对码</small><b>${escapeHtml(session.pairCode || '--')}</b></div><div class="detail-box"><small>内部记录 ID</small><b>${session.id}</b></div><div class="detail-box"><small>访客 ID</small><b>${escapeHtml(session.visitorId)}</b></div><div class="detail-box"><small>开始时间</small><b>${formatDateTime(session.startedAt)}</b></div><div class="detail-box"><small>完成时间</small><b>${formatDateTime(session.completedAt)}</b></div><div class="detail-box"><small>挑食指数</small><b>${result?.pickyScore ?? '--'}</b></div><div class="detail-box"><small>题数</small><b>${session.answers.length}</b></div></div><h3>完整选择</h3><div class="answers-list">${session.answers.sort((a, b) => a.order - b.order).map((answer) => { const food = getFoodById(answer.foodId); return `<div class="answer-row"><span class="emoji">${food?.emoji || '🍽️'}</span><b>${escapeHtml(food?.name || answer.foodId)}</b><span>${choiceNames[answer.choice]}</span><small>${Math.round((answer.durationMs || 0) / 1000)}s</small></div>`; }).join('') || '<p>暂无选择。</p>'}</div><h3>设备环境</h3><div class="detail-grid"><div class="detail-box"><small>IP</small><b>${escapeHtml(session.ip || '--')}</b></div><div class="detail-box"><small>设备</small><b>${escapeHtml(session.device?.model || '未知')} / ${escapeHtml(session.device?.type || '未知')}</b></div><div class="detail-box"><small>系统</small><b>${escapeHtml(session.device?.os || '未知')}</b></div><div class="detail-box"><small>浏览器</small><b>${escapeHtml(session.device?.browser || '未知')}</b></div><div class="detail-box"><small>屏幕</small><b>${session.viewport?.width || '--'} × ${session.viewport?.height || '--'}</b></div><div class="detail-box"><small>语言 / 时区</small><b>${escapeHtml(session.language || '--')} / ${escapeHtml(session.timezone || '--')}</b></div></div><h3>User-Agent</h3><p class="raw">${escapeHtml(session.userAgent || '--')}</p>`;
  $('#drawer').hidden = false; $('#drawer-backdrop').hidden = false; document.body.classList.add('drawer-open');
}
function closeDetail() { $('#drawer').hidden = true; $('#drawer-backdrop').hidden = true; document.body.classList.remove('drawer-open'); }
function exportData() { const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `picky-sessions-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); }
async function refresh() { await Promise.all([loadSummary(), loadSessions()]); }

$('#refresh').addEventListener('click', refresh); $('#search-button').addEventListener('click', loadSessions); $('#status-filter').addEventListener('change', loadSessions); $('#search').addEventListener('keydown', (event) => { if (event.key === 'Enter') loadSessions(); }); $('#export').addEventListener('click', exportData); $('#session-rows').addEventListener('click', (event) => { const row = event.target.closest('tr[data-id]'); if (row) openDetail(row.dataset.id); }); $('#drawer-close').addEventListener('click', closeDetail); $('#drawer-backdrop').addEventListener('click', closeDetail);
refresh();
