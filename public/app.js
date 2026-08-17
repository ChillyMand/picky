import { getFoodById } from '/modules/foods.js';
import { createInitialQueue, selectFollowUps, buildQuestionQueue } from '/modules/adaptive.js';
import QRCode from 'qrcode';
import { buildShareCardModel, buildPairInviteUrl } from '/modules/share.js';
import { pickShareTheme } from '/modules/share-themes.js';
import { normalizePublicCode, isPublicCode } from '/modules/codes.js';
import { createVisitorId, clearProgress, copyText } from '/modules/browser-compat.js';

const app = document.querySelector('#app');
const CHOICES = [
  ['love', '😋', '超爱吃'], ['okay', '🙂', '可以吃'], ['refuse', '😖', '坚决不吃'], ['unknown', '❓', '没吃过'],
];
const STORAGE_KEY = 'picky-test-progress-v1';
const visitorId = createVisitorId(globalThis.localStorage);
let state = { sessionId: null, publicCode: null, pairCode: null, match: null, answers: [], queue: buildQuestionQueue([]), index: 0, result: null };
let pendingPairCode = normalizePublicCode(new URLSearchParams(location.search).get('pair'));
let pendingWrites = [];
let questionStartedAt = Date.now();

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clear() { clearProgress(globalThis.localStorage, STORAGE_KEY); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function screen(content, className = '') { app.innerHTML = `<section class="screen ${className}">${content}</section>`; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showToast(message) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.append(node); setTimeout(() => node.remove(), 1800); }

function showIntro() {
  screen(`${pendingPairCode ? `<div class="pair-banner">正在加入配对 <strong>${escapeHtml(pendingPairCode)}</strong>，完成测试即可查看你们的匹配度。</div>` : ''}<div class="rice-character">🍙</div><h1>先对一下暗号</h1><p class="intro-copy">不考虑具体做法，只回答你平时愿不愿意吃。</p><div class="rules">${CHOICES.map(([, emoji, label], index) => `<div class="rule"><strong>${emoji} ${label}</strong><small>${['看到会主动夹', '有就吃，没有也行', '会挑出来或直接拒绝', '暂时无法判断'][index]}</small></div>`).join('')}</div><div class="friendly-note">没有正确答案，挑食也不扣饭票。</div><button class="primary-button" data-action="start">${pendingPairCode ? '开始配对测试' : '我准备好了'} →</button><button class="secondary-button" data-action="home">返回首页</button>`, 'intro-screen');
}

async function createSession() {
  const response = await fetch('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId, pairCode: pendingPairCode || null, viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, referrer: document.referrer }) });
  if (!response.ok) throw new Error('暂时无法开始');
  const session = await response.json(); state = { sessionId: session.id, publicCode: session.publicCode, pairCode: session.pairCode, match: null, answers: [], queue: buildQuestionQueue([]), index: 0, result: null }; save(); showQuestion();
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
  try { await Promise.allSettled(pendingWrites); const response = await fetch(`/api/sessions/${state.sessionId}/complete`, { method: 'POST' }); if (!response.ok) throw new Error(); const completed = await response.json(); state.result = completed.result; state.match = completed.match; save(); setTimeout(showResult, 650); }
  catch { screen(`<div class="feedback-sticker">🍚</div><h1>饭碗检查暂停了一下</h1><p>你的选择还在，重试即可。</p><button class="primary-button" data-action="finish">重新生成结果</button>`, 'feedback-screen'); }
}

const dimensionLabels = { variety: '食材接受', odor: '气味耐受', texture: '口感包容', appearance: '外观接受', seafood: '水产友好', exploration: '探索意愿' };
function showResult() {
  const result = state.result; if (!result) return finish();
  const match = state.match;
  const pairSection = match ? `<div class="result-card pair-report"><h2>你们的饭桌匹配度</h2><div class="pair-score">${match.score}%</div><p class="verdict">${escapeHtml(match.verdict)}</p><p>共同回答 ${match.overlapCount} 道题</p><div class="pair-lists"><div><h3>😋 都爱吃</h3><p>${match.sharedLikes.map((food) => escapeHtml(food.name)).join('、') || '暂时没有'}</p></div><div><h3>🤝 一起避开</h3><p>${match.sharedAvoids.map((food) => escapeHtml(food.name)).join('、') || '暂时没有'}</p></div><div><h3>⚡ 饭桌分歧</h3><p>${match.conflicts.map((food) => escapeHtml(food.name)).join('、') || '几乎没有'}</p></div></div></div>` : `<div class="pair-code-card"><small>你的测试 ID · 好友配对码</small><strong>${escapeHtml(state.publicCode || '-----')}</strong><p>把测试码发给好友；双方都测完后，输入对方的测试码即可直接查看。</p><input id="result-friend-code" maxlength="5" autocomplete="off" placeholder="输入对方测试码" aria-label="输入对方测试码"><div class="pair-actions"><button data-action="copy-pair">复制配对码</button><button data-action="lookup-result-match">查看匹配度</button></div></div>`;
  screen(`<div class="result-hero"><span class="result-label">你的饭桌人格是</span><h1>${escapeHtml(result.personality.name)}</h1><div class="score-orb"><div><strong>${result.pickyScore}</strong><small>挑食指数</small></div></div><div class="tags">${result.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div>${pairSection}<div class="result-card"><p class="verdict">${escapeHtml(result.verdict)}</p>${result.easterEgg ? `<p class="easter">🎉 ${escapeHtml(result.easterEgg)}</p>` : ''}<p class="lead" style="text-align:left">挑食指数反映你的饮食边界，不代表饮食健康程度。</p></div><div class="result-card"><h2>你的饭碗边界</h2><div class="dimensions">${Object.entries(result.dimensions).map(([key, value]) => `<div class="dimension-row"><span>${dimensionLabels[key]}</span><span class="dimension-track"><i style="width:${value}%"></i></span><b>${value}</b></div>`).join('')}</div></div><div class="share-card" id="share-card"><small>MY TABLE PERSONALITY</small><h2>${escapeHtml(result.personality.name)}</h2><div class="share-score">${result.pickyScore}</div><p>${result.tags.map(escapeHtml).join(' · ')}</p><p>${escapeHtml(result.verdict)}</p><b>配对码 ${escapeHtml(state.publicCode || '-----')}</b></div><div class="share-actions"><button data-action="share">分享链接</button><button data-action="download">保存图片</button></div><button class="secondary-button" data-action="restart">重新测一次</button>`, 'result-screen');
}

function pairUrl() { return buildPairInviteUrl(state.publicCode, location.origin); }
async function copyPair() { const copied = await copyText(`${state.publicCode}\n${pairUrl()}`); showToast(copied ? '配对码和邀请链接已复制' : '复制失败，请长按配对码复制'); }
async function checkPair() { const response = await fetch(`/api/pairs/${state.publicCode}`); if (!response.ok) return showToast('暂时无法查询'); const report = await response.json(); if (report.waiting) return showToast('好友完成测试后即可查看'); state.match = report; save(); showResult(); }
async function joinPair() { const input = document.querySelector('#pair-code-input'); const code = normalizePublicCode(input?.value); if (!isPublicCode(code)) return showToast('请输入完整的 5 位配对码'); const response = await fetch(`/api/pairs/${code}`); if (!response.ok) return showToast('没有找到这个配对码'); pendingPairCode = code; history.replaceState(null, '', `/?pair=${code}`); showIntro(); }
function showDirectMatch(match) { screen(`<div class="feedback-sticker">🍻</div><p class="eyebrow">${escapeHtml(match.firstCode)} × ${escapeHtml(match.secondCode)}</p><h1>你们的饭桌匹配度</h1><div class="result-card pair-report"><div class="pair-score">${match.score}%</div><p class="verdict">${escapeHtml(match.verdict)}</p><p>共同回答 ${match.overlapCount} 道题</p><div class="pair-lists"><div><h3>😋 都爱吃</h3><p>${match.sharedLikes.map((food) => escapeHtml(food.name)).join('、') || '暂时没有'}</p></div><div><h3>🤝 一起避开</h3><p>${match.sharedAvoids.map((food) => escapeHtml(food.name)).join('、') || '暂时没有'}</p></div><div><h3>⚡ 饭桌分歧</h3><p>${match.conflicts.map((food) => escapeHtml(food.name)).join('、') || '几乎没有'}</p></div></div></div><button class="secondary-button" data-action="home">返回首页</button>`, 'result-screen'); }
async function lookupMatch() { const first = normalizePublicCode(document.querySelector('#first-match-code')?.value); const second = normalizePublicCode(document.querySelector('#second-match-code')?.value); if (!isPublicCode(first) || !isPublicCode(second) || first === second) return showToast('请输入两个不同的 5 位测试码'); const response = await fetch(`/api/matches?first=${first}&second=${second}`); const payload = await response.json(); if (!response.ok) return showToast(payload.error || '暂时无法查询'); showDirectMatch(payload); }
async function lookupResultMatch() { const second = normalizePublicCode(document.querySelector('#result-friend-code')?.value); if (!isPublicCode(state.publicCode) || !isPublicCode(second) || state.publicCode === second) return showToast('请输入对方完整的 5 位测试码'); const response = await fetch(`/api/matches?first=${state.publicCode}&second=${second}`); const payload = await response.json(); if (!response.ok) return showToast(payload.error || '暂时无法查询'); state.match = { hostCode: payload.firstCode, guestCode: payload.secondCode, ...payload }; save(); showResult(); }
async function shareResult() { const copied = await copyText(`快来测测我们的饭桌默契度！我的配对码是 ${state.publicCode}：${pairUrl()}`); showToast(copied ? '邀请文案和链接已复制' : '复制失败，请长按配对码复制'); }
function showImagePreview(imageUrl, filename) {
  document.querySelector('.share-preview-overlay')?.remove();
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
  const showDownload = !isWeChat && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const overlay = document.createElement('div'); overlay.className = 'share-preview-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="share-preview-header"><h2>图片已生成</h2><p>长按图片保存到相册</p></div><div class="share-preview-image-wrap"><img class="share-preview-image" alt="饭桌人格分享图"></div><div class="share-preview-actions"><button type="button" data-preview-close>关闭</button>${showDownload ? '<a data-preview-download>下载图片</a>' : ''}</div>`;
  overlay.querySelector('.share-preview-image').src = imageUrl;
  const download = overlay.querySelector('[data-preview-download]'); if (download) { download.href = imageUrl; download.download = filename; }
  const close = () => { overlay.remove(); document.body.classList.remove('share-preview-open'); };
  overlay.querySelector('[data-preview-close]').addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  document.body.classList.add('share-preview-open'); document.body.append(overlay);
}
async function downloadCard() {
  if (!isPublicCode(state.publicCode)) return showToast('测试码生成中，请稍后重试');
  const card = buildShareCardModel(state.result, state.publicCode);
  const theme = pickShareTheme();
  const qrCanvas = document.createElement('canvas');
  try {
    await QRCode.toCanvas(qrCanvas, card.pairUrl, {
      errorCorrectionLevel: 'H', margin: 4, width: 260,
      color: { dark: theme.qrDark, light: '#ffffff' },
    });
  } catch { return showToast('人格卡生成失败，请重试'); }
  const canvas = document.createElement('canvas'); canvas.width = card.width; canvas.height = card.height;
  const context = canvas.getContext('2d'); context.fillStyle = theme.background; context.fillRect(0, 0, card.width, card.height);
  context.fillStyle = theme.accent; context.beginPath(); context.arc(940, 70, 230, 0, Math.PI * 2); context.fill();
  context.textAlign = 'center'; context.fillStyle = theme.primary; context.font = '700 34px sans-serif'; context.fillText('MY TABLE PERSONALITY', 540, 130);
  context.fillStyle = theme.foreground; context.font = '900 82px sans-serif'; context.fillText(card.personality, 540, 330);
  context.fillStyle = theme.primary; context.font = '900 210px sans-serif'; context.fillText(String(card.pickyScore), 540, 570);
  context.fillStyle = theme.foreground; context.font = '32px sans-serif'; context.fillText('挑食指数', 540, 645);
  context.fillStyle = theme.accent; context.font = '700 34px sans-serif'; context.fillText(card.tags.join(' · '), 540, 760);
  context.fillStyle = theme.foreground; context.font = '38px sans-serif';
  const words = [...card.verdict]; const lines = []; let line = '';
  for (const word of words) { const next = line + word; if (context.measureText(next).width > 800) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); lines.slice(0, 2).forEach((text, index) => context.fillText(text, 540, 850 + index * 56));
  context.save();
  context.translate(540, 1160);
  context.rotate(2 * Math.PI / 180);
  context.fillStyle = theme.stickerShadow; context.fillRect(-151, -186, 330, 400);
  context.fillStyle = '#ffffff'; context.fillRect(-165, -200, 330, 400);
  context.save(); context.translate(-130, -170); context.drawImage(qrCanvas, 0, 0, 260, 260); context.restore();
  context.fillStyle = theme.qrDark; context.font = '900 43px ui-monospace, monospace'; context.fillText(card.publicCode, 0, 132);
  context.font = '700 20px sans-serif'; context.fillText('扫我测匹配度 ↗', 0, 170);
  context.restore();
  try { showImagePreview(canvas.toDataURL('image/jpeg', .92), card.filename); }
  catch { showToast('人格卡生成失败，请重试'); }
}

app.addEventListener('click', async (event) => {
  const choiceButton = event.target.closest('[data-choice]'); if (choiceButton) return answer(choiceButton.dataset.choice);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'show-intro') showIntro(); else if (action === 'join-pair') joinPair(); else if (action === 'lookup-match') lookupMatch(); else if (action === 'lookup-result-match') lookupResultMatch(); else if (action === 'home') location.href = '/'; else if (action === 'start') { try { await createSession(); } catch { showToast('暂时无法开始，请重试'); } } else if (action === 'continue') showQuestion(); else if (action === 'back') { state.index = Math.max(0, state.index - 1); showQuestion(); } else if (action === 'finish') finish(); else if (action === 'share') shareResult(); else if (action === 'copy-pair') copyPair(); else if (action === 'check-pair') checkPair(); else if (action === 'download') downloadCard(); else if (action === 'restart') { clear(); pendingPairCode = ''; history.replaceState(null, '', '/'); showIntro(); }
});

clear();
if (isPublicCode(pendingPairCode)) showIntro();
const pairInput = document.querySelector('#pair-code-input'); if (pairInput && pendingPairCode) pairInput.value = pendingPairCode;
