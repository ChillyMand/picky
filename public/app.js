import { getFoodById } from '/modules/foods.js';
import { createInitialQueue, selectFollowUps, buildQuestionQueue } from '/modules/adaptive.js';
import { buildShareText, buildShareCardModel } from '/modules/share.js';

const app = document.querySelector('#app');
const CHOICES = [
  ['love', '😋', '超爱吃'], ['okay', '🙂', '可以吃'], ['refuse', '😖', '坚决不吃'], ['unknown', '❓', '没吃过'],
];
const STORAGE_KEY = 'picky-test-progress-v1';
const visitorId = localStorage.getItem('picky-visitor-id') || crypto.randomUUID();
localStorage.setItem('picky-visitor-id', visitorId);
let state = { sessionId: null, answers: [], queue: buildQuestionQueue([]), index: 0, result: null };
let pendingWrites = [];
let questionStartedAt = Date.now();

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clear() { localStorage.removeItem(STORAGE_KEY); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function screen(content, className = '') { app.innerHTML = `<section class="screen ${className}">${content}</section>`; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showToast(message) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.append(node); setTimeout(() => node.remove(), 1800); }

function showIntro() {
  screen(`<div class="rice-character">🍙</div><h1>先对一下暗号</h1><p class="intro-copy">不考虑具体做法，只回答你平时愿不愿意吃。</p><div class="rules">${CHOICES.map(([, emoji, label], index) => `<div class="rule"><strong>${emoji} ${label}</strong><small>${['看到会主动夹', '有就吃，没有也行', '会挑出来或直接拒绝', '暂时无法判断'][index]}</small></div>`).join('')}</div><div class="friendly-note">没有正确答案，挑食也不扣饭票。</div><button class="primary-button" data-action="start">我准备好了 →</button><button class="secondary-button" data-action="home">返回首页</button>`, 'intro-screen');
}

async function createSession() {
  const response = await fetch('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId, viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, referrer: document.referrer }) });
  if (!response.ok) throw new Error('暂时无法开始');
  const session = await response.json(); state = { sessionId: session.id, answers: [], queue: buildQuestionQueue([]), index: 0, result: null }; save(); showQuestion();
}

function questionCopy(food) {
  if (food.id === 'coriander') return '香菜靠近时，你的第一反应是？';
  if (food.appearance >= 3) return `${food.name}出现在桌上时，你会？`;
  if (food.odor >= 3) return `${food.name}的气味，你能接受吗？`;
  return `${food.name}，你吃吗？`;
}
function kindFor(id) { return createInitialQueue().includes(id) ? 'initial' : ['zheergen', 'pig_brain', 'fish_head', 'snail_noodle', 'oyster', 'bitter_melon'].includes(id) ? 'confirmation' : 'follow_up'; }

function showQuestion() {
  const id = state.queue[state.index]; const food = getFoodById(id); if (!food) return finish();
  questionStartedAt = Date.now(); const progress = Math.min(96, Math.round((state.answers.length / 54) * 100));
  screen(`<div class="progress-row"><span class="zone-label">${escapeHtml(food.category)}</span><span>已完成 ${state.answers.length} 题</span></div><div class="progress"><span style="width:${progress}%"></span></div><div class="food-card"><span class="emoji" aria-hidden="true">${food.emoji}</span>${food.challenge >= 3 ? '<span class="challenge">经典难题</span>' : ''}</div><h1 class="question-title">${escapeHtml(questionCopy(food))}</h1><div class="answers">${CHOICES.map(([choice, emoji, label]) => `<button class="answer-button" data-choice="${choice}"><span aria-hidden="true">${emoji}</span> ${label}</button>`).join('')}</div>${state.index ? '<button class="secondary-button back-button" data-action="back">← 上一题</button>' : ''}`, 'question-screen');
}

function archiveAnswer(answer) {
  const promise = fetch(`/api/sessions/${state.sessionId}/answers/${answer.foodId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(answer) });
  pendingWrites.push(promise); promise.finally(() => { pendingWrites = pendingWrites.filter((item) => item !== promise); });
}

function answer(choice) {
  const foodId = state.queue[state.index]; const item = { foodId, choice, order: state.index + 1, kind: kindFor(foodId), durationMs: Date.now() - questionStartedAt };
  state.answers = state.answers.filter((answerItem) => answerItem.foodId !== foodId); state.answers.push(item); archiveAnswer(item);
  const extras = selectFollowUps(state.answers).filter((id) => !state.queue.includes(id));
  if (extras.length) state.queue.splice(state.index + 1, 0, ...extras);
  state.index += 1; save();
  if (state.answers.length >= 54 || state.index >= state.queue.length) return finish();
  if ([12, 30, 45].includes(state.answers.length)) return showFeedback();
  showQuestion();
}

function showFeedback() {
  const messages = state.answers.length < 10 ? ['初步判断：你还算好养。', '不过真正的挑战才刚刚开始。'] : ['饭桌人格已经逐渐清晰。', '再来几题，马上宣判。'];
  screen(`<div class="feedback-sticker">🫣</div><h1>${messages[0]}</h1><p>${messages[1]}</p><button class="primary-button" data-action="continue">继续检查 →</button>`, 'feedback-screen');
}

async function finish() {
  screen(`<div class="feedback-sticker">🍚</div><h1>正在检查你的饭碗</h1><p>定位口感雷区·分析饭桌人格</p><div class="loading-dots"><i></i><i></i><i></i></div>`, 'loading-screen');
  try { await Promise.allSettled(pendingWrites); const response = await fetch(`/api/sessions/${state.sessionId}/complete`, { method: 'POST' }); if (!response.ok) throw new Error(); state.result = (await response.json()).result; save(); setTimeout(showResult, 650); }
  catch { screen(`<div class="feedback-sticker">🍚</div><h1>饭碗检查暂停了一下</h1><p>你的选择还在，重试即可。</p><button class="primary-button" data-action="finish">重新生成结果</button>`, 'feedback-screen'); }
}

const dimensionLabels = { variety: '食材接受', odor: '气味耐受', texture: '口感包容', appearance: '外观接受', seafood: '水产友好', exploration: '探索意愿' };
function showResult() {
  const result = state.result; if (!result) return finish();
  screen(`<div class="result-hero"><span class="result-label">你的饭桌人格是</span><h1>${escapeHtml(result.personality.name)}</h1><div class="score-orb"><div><strong>${result.pickyScore}</strong><small>挑食指数</small></div></div><div class="tags">${result.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div><div class="result-card"><p class="verdict">${escapeHtml(result.verdict)}</p>${result.easterEgg ? `<p class="easter">🎉 ${escapeHtml(result.easterEgg)}</p>` : ''}<p class="lead" style="text-align:left">挑食指数反映你的饮食边界，不代表饮食健康程度。</p></div><div class="result-card"><h2>你的饭碗边界</h2><div class="dimensions">${Object.entries(result.dimensions).map(([key, value]) => `<div class="dimension-row"><span>${dimensionLabels[key]}</span><span class="dimension-track"><i style="width:${value}%"></i></span><b>${value}</b></div>`).join('')}</div></div><div class="share-card" id="share-card"><small>MY TABLE PERSONALITY</small><h2>${escapeHtml(result.personality.name)}</h2><div class="share-score">${result.pickyScore}</div><p>${result.tags.map(escapeHtml).join(' · ')}</p><p>${escapeHtml(result.verdict)}</p><b>你和我能吃到一桌吗？</b></div><div class="share-actions"><button data-action="share">分享结果</button><button data-action="download">保存人格卡</button></div><button class="secondary-button" data-action="restart">重新测一次</button>`, 'result-screen');
}

async function shareResult() { const text = buildShareText(state.result); if (navigator.share) { try { await navigator.share({ title: '我的饭桌人格', text, url: location.origin }); return; } catch {} } await navigator.clipboard.writeText(`${text} ${location.origin}`); showToast('分享文案已复制'); }
function downloadCard() {
  const card = buildShareCardModel(state.result, state.sessionId);
  const canvas = document.createElement('canvas'); canvas.width = card.width; canvas.height = card.height;
  const context = canvas.getContext('2d'); context.fillStyle = '#322c27'; context.fillRect(0, 0, card.width, card.height);
  context.fillStyle = '#dfff70'; context.beginPath(); context.arc(940, 70, 230, 0, Math.PI * 2); context.fill();
  context.textAlign = 'center'; context.fillStyle = '#ffb4c9'; context.font = '700 34px sans-serif'; context.fillText('MY TABLE PERSONALITY', 540, 150);
  context.fillStyle = '#ffffff'; context.font = '900 82px sans-serif'; context.fillText(card.personality, 540, 410);
  context.fillStyle = '#ffb4c9'; context.font = '900 220px sans-serif'; context.fillText(String(card.pickyScore), 540, 690);
  context.fillStyle = '#ffffff'; context.font = '32px sans-serif'; context.fillText('挑食指数', 540, 760);
  context.fillStyle = '#dfff70'; context.font = '700 34px sans-serif'; context.fillText(card.tags.join(' · '), 540, 930);
  context.fillStyle = '#ffffff'; context.font = '40px sans-serif';
  const words = [...card.verdict]; const lines = []; let line = '';
  for (const word of words) { const next = line + word; if (context.measureText(next).width > 800) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); lines.slice(0, 3).forEach((text, index) => context.fillText(text, 540, 1060 + index * 60));
  context.font = '700 30px sans-serif'; context.fillText('你和我能吃到一桌吗？', 540, 1320);
  context.textAlign = 'right'; context.fillStyle = '#8f8983'; context.font = '24px ui-monospace, monospace'; context.fillText(card.shortId, 1010, 1385);
  canvas.toBlob((blob) => {
    if (!blob) { showToast('人格卡生成失败，请重试'); return; }
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = card.filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/jpeg', .92);
}

app.addEventListener('click', async (event) => {
  const choiceButton = event.target.closest('[data-choice]'); if (choiceButton) return answer(choiceButton.dataset.choice);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'show-intro') showIntro(); else if (action === 'home') location.reload(); else if (action === 'start') { try { await createSession(); } catch { showToast('暂时无法开始，请重试'); } } else if (action === 'continue') showQuestion(); else if (action === 'back') { state.index = Math.max(0, state.index - 1); showQuestion(); } else if (action === 'finish') finish(); else if (action === 'share') shareResult(); else if (action === 'download') downloadCard(); else if (action === 'restart') { clear(); showIntro(); }
});

try { const restored = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (restored?.sessionId && restored.result) { state = restored; showResult(); } else if (restored?.sessionId && restored.queue?.length) { state = restored; showQuestion(); } } catch { clear(); }
