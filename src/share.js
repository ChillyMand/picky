function xml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]); }

export function buildShareText(result) {
  return `我的挑食指数是 ${result.pickyScore}%，属于“${result.personality.name}”。${result.verdict} 你是多少？`;
}

export function buildShareSvg(result) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440"><rect width="1080" height="1440" rx="70" fill="#322c27"/><circle cx="920" cy="100" r="210" fill="#dfff70"/><text x="90" y="150" fill="#ffb4c9" font-size="34" font-family="sans-serif" font-weight="700">MY TABLE PERSONALITY</text><text x="540" y="430" text-anchor="middle" fill="white" font-size="82" font-family="sans-serif" font-weight="900">${xml(result.personality.name)}</text><text x="540" y="690" text-anchor="middle" fill="#ffb4c9" font-size="220" font-family="sans-serif" font-weight="900">${result.pickyScore}</text><text x="540" y="760" text-anchor="middle" fill="white" font-size="32" font-family="sans-serif">挑食指数</text><text x="540" y="930" text-anchor="middle" fill="#dfff70" font-size="34" font-family="sans-serif" font-weight="700">${result.tags.map(xml).join(' · ')}</text><foreignObject x="120" y="1010" width="840" height="250"><div xmlns="http://www.w3.org/1999/xhtml" style="font:40px sans-serif;color:white;text-align:center;line-height:1.6">${xml(result.verdict)}</div></foreignObject><text x="540" y="1340" text-anchor="middle" fill="white" font-size="30" font-family="sans-serif">你和我能吃到一桌吗？</text></svg>`;
}
