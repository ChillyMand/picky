# PICKY! Mobile Intro and Answer Interaction — Design QA

## Evidence

- Source visual truth: `/Users/linshuhang/Downloads/截屏 2026-08-19 12.00.56.png`
- Revised pairing intro: `/Users/linshuhang/Documents/wzrice网站构建/picky-test/qa-intro-flow3.png`
- Selected-answer state: `/Users/linshuhang/Documents/wzrice网站构建/picky-test/qa-selected-flow4-mobile.png`
- Combined comparison: `/Users/linshuhang/Documents/wzrice网站构建/picky-test/qa-mobile-comparison.png`
- Source pixels: 943 × 2048, including the mobile browser chrome.
- Implementation pixels: 393 × 852 at a 393 × 852 CSS viewport and devicePixelRatio 1.
- Density normalization: both complete screenshots were scaled with `object-fit: contain` into equal-width, top-aligned comparison panels. Browser chrome in the source is excluded from app-layout judgments.
- State: pairing invitation intro using pairing code `746Q6`, plus first-question selected-answer feedback.

## Browser verification

- Pairing intro title renders at 38px.
- Four rule cards render at approximately 68.6px each.
- Pairing start button is visible at 393 × 852 (top 689.1px, bottom 754.1px).
- Question screen uses `position: fixed`, `overflow: hidden`, and a document height equal to the 852px viewport.
- A simulated 520px upward swipe leaves `scrollY` at 0 and document height at 852px.
- Selecting “可以吃” immediately produces one selected button, three dimmed buttons, `aria-pressed="true"`, and visible “已选择” copy before the question advances after 320ms.
- Non-selected “已选择” labels remain hidden from the rendered accessibility structure.
- Browser console errors checked: none.

## Required fidelity surfaces

- Fonts and typography: title increased from the compressed 27px branch to 38px; explanatory copy and button labels use readable 14–18px mobile sizes with no truncation.
- Spacing and layout rhythm: removed the max-height compression branch; cards are taller, gaps are consistent, and the primary action uses the previously empty lower portion of the viewport. Smaller screens may scroll on the intro, by design.
- Colors and visual tokens: retained the cream, ink, lime, coral, blue, and pink system. Selected answers use semantic per-choice fills while unselected answers dim without disappearing.
- Image quality and asset fidelity: the supplied PICKY raster logo is unchanged and remains sharp at the enlarged intro size.
- Copy and content: all four expanded definitions remain intact; selected feedback says “已选择” and is shown only on the selected answer.

## Findings

- No actionable P0/P1/P2 findings remain.
- P3: the source screenshot includes WeChat/browser chrome while the implementation capture contains only app content; this is an expected capture-surface difference.

## Comparison history

1. Source audit found a P2 density problem: the `max-height: 760px` branch reduced the title to 27px, card padding to 7px, and CTA padding to 12px despite substantial unused space below.
2. Source audit found a P1 interaction problem: the page rendered the next question immediately, destroying the touch `:active` state before it could be perceived.
3. Source audit found a P2 movement problem: the question document remained taller than the mobile viewport and allowed vertical overscroll.
4. Fixes: removed extreme intro compression, enlarged the hierarchy and cards, added a 320ms selected state with disabled/dimmed peers, and locked only `question-screen` to `100dvh`.
5. Post-fix evidence confirms improved scale, visible interaction feedback, and zero scroll movement after a simulated swipe.

## Implementation checklist

- [x] Intro typography and cards enlarged.
- [x] Pairing CTA remains visible at 393 × 852.
- [x] Touch selection is visible before navigation.
- [x] Repeated taps are blocked during the transition.
- [x] Reduced-motion users retain color and text feedback.
- [x] Scrolling is locked only during question screens.
- [x] Intro, feedback, result, and Admin pages retain normal scrolling.
- [x] Mobile browser console is clear.

final result: passed
