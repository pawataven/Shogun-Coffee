/* Shogun Coffee — motion layer (GSAP + ScrollTrigger + SplitText + Flip + Lenis)
   Every effect checks that its elements exist, so one file serves every page. */
(() => {
'use strict';
const root = document.documentElement;
// ?motion=1 forces full motion (useful for previews where the OS asks for reduced motion)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion=1/.test(location.search);
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hasGsap = typeof window.gsap !== 'undefined';
root.classList.add('js');
if (reduce || !hasGsap) root.classList.add('reduced');

/* ---------------- page curtain ---------------- */
// lift as soon as fonts are ready (not on window.load, which waits for every image/video)
const curtainOff = () => root.classList.add('mo-ready');
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(curtainOff);
window.addEventListener('pageshow', (e) => { if (e.persisted) { root.classList.remove('mo-leaving'); root.classList.add('mo-ready'); } });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = a.getAttribute('href');
  if (a.target === '_blank' || a.hasAttribute('download') || !/^[\w-]+\.html(\?[^#]*)?(#.*)?$/.test(href)) return;
  const url = new URL(href, location.href);
  if (url.pathname === location.pathname) return; // same page anchors handled below
  if (reduce) return;
  e.preventDefault();
  root.classList.remove('mo-ready');
  root.classList.add('mo-leaving');
  setTimeout(() => { location.href = url.href; }, 520);
});

/* ---------------- toast ---------------- */
let toastEl;
window.moToast = (msg) => {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('is-on');
  clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
};

/* ---------------- lazy video: load near view, play only while visible ---------------- */
const vids = $$('video[data-src]');
if (vids.length) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; v.load(); }
        if (!reduce) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '200px 0px' });
  vids.forEach((v) => { v.muted = true; v.playsInline = true; vio.observe(v); });
}

/* ---------------- body-lock safety net ----------------
   nav.js locks <body> (position:fixed) while its dialogs are open; its lock counter can
   stay above zero after the delivery dialog closes, leaving the page frozen. When no
   dialog is open any more, release the lock and restore the scroll position. */
const unlockIfIdle = () => setTimeout(() => {
  if (document.querySelector('dialog[open]') || document.body.style.position !== 'fixed') return;
  const y = -parseInt(document.body.style.top || '0', 10) || 0;
  document.body.removeAttribute('style');
  window.scrollTo(0, y);
}, 60);
window.addEventListener('shogun:delivery-closed', unlockIfIdle);
// watch the dialogs' [open] attribute directly: their 'close' event isn't always delivered
const dialogWatch = new MutationObserver((muts) => { if (muts.some((m) => !m.target.open)) unlockIfIdle(); });
document.querySelectorAll('dialog').forEach((d) => dialogWatch.observe(d, { attributes: true, attributeFilter: ['open'] }));

/* ---------------- shared bits that work without GSAP ---------------- */
// copy buttons
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); window.moToast(`คัดลอก ${b.dataset.copy} แล้ว`); }
  catch { window.moToast(b.dataset.copy); }
}));

if (!hasGsap) { initPageLogic(null); return; }

const { gsap } = window;
gsap.registerPlugin(window.ScrollTrigger, window.SplitText, window.Flip);
const ST = window.ScrollTrigger;

/* ---------------- Lenis smooth scroll ---------------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ST.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // pause while nav.js dialogs lock the body
  new MutationObserver(() => {
    if (document.body.style.position === 'fixed') lenis.stop(); else lenis.start();
  }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  window.addEventListener('shogun:delivery-opened', () => lenis.stop());
  window.addEventListener('shogun:delivery-closed', () => lenis.start());
}
window.moLenis = lenis;
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const t = document.getElementById(a.getAttribute('href').slice(1));
  if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { offset: -20 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', a.getAttribute('href'));
});

if (reduce) { initPageLogic(null); return; }

/* ---------------- split-text headings ---------------- */
document.fonts.ready.then(() => {
  $$('[data-split]').forEach((el) => {
    // SplitText re-flows lines itself and does not know Thai word boundaries, so it broke words across lines
    // ("สเปเชีย / ลตี้"). Thai headings keep the browser's own line breaks and simply rise in.
    if (/[฀-๿]/.test(el.textContent)) {
      gsap.from(el, {
        y: 32, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: el.hasAttribute('data-split-now') ? null : { trigger: el, start: 'top 88%' },
        delay: el.hasAttribute('data-split-now') ? .45 : 0,
      });
      return;
    }
    const type = el.dataset.split || 'chars';
    // 'words' keeps each word together; with only lines + chars a line could break between any two letters
    // ("HIGHLIG / HTS" on phones).
    const split = new window.SplitText(el, { type: type === 'lines' ? 'lines' : 'lines,words,chars', mask: 'lines', linesClass: 'split-line', wordsClass: 'split-word' });
    const targets = type === 'lines' ? split.lines : split.chars;
    gsap.from(targets, {
      yPercent: 110, rotate: type === 'lines' ? 0 : 6, duration: type === 'lines' ? 1 : .9, ease: 'expo.out',
      stagger: type === 'lines' ? .1 : .025,
      scrollTrigger: el.hasAttribute('data-split-now') ? null : { trigger: el, start: 'top 88%' },
      delay: el.hasAttribute('data-split-now') ? .45 : 0,
    });
  });
  ST.refresh();
});

/* ---------------- reveals ---------------- */
ST.batch('.rv', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08, overwrite: true }) });
ST.batch('.rv-scale', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out', stagger: .08 }) });
$$('.img-reveal').forEach((el) => gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } }));

/* parallax: data-speed (-1..1) moves element as it crosses the viewport */
$$('[data-speed]').forEach((el) => {
  const s = parseFloat(el.dataset.speed) || 0;
  gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* --p progress var (CSS driven effects) */
$$('[data-progress]').forEach((el) => {
  const [a, b] = (el.dataset.range || 'top 90%,top 40%').split(',');
  ST.create({ trigger: el, start: a, end: b, scrub: true, onUpdate: (self) => el.style.setProperty('--p', self.progress.toFixed(4)) });
});

/* marquee: endless loop whose speed and direction follow scroll velocity */
$$('[data-marquee]').forEach((m) => {
  const track = $('.marquee__track', m);
  const item = $('.marquee__item', track);
  if (!item) return;
  while (track.scrollWidth < window.innerWidth * 3) track.appendChild(item.cloneNode(true));
  track.querySelectorAll('.marquee__item').forEach((n, i) => i && n.setAttribute('aria-hidden', 'true'));
  const w = item.getBoundingClientRect().width;
  const dir = m.dataset.marquee === 'right' ? 1 : -1;
  let x = 0; let boost = 0;
  ST.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: (self) => { boost = Math.min(Math.abs(self.getVelocity()) / 120, 14) * (self.direction || 1); } });
  gsap.ticker.add((t, dt) => {
    boost *= 0.93;
    const sgn = boost < 0 ? -1 : 1;
    x += dir * sgn * 0.06 * dt * (1 + Math.abs(boost));
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
});

/* magnetic buttons */
if (fine) $$('[data-magnetic]').forEach((el) => {
  const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
  const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .35); });
  el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
});

/* label cursor */
if (fine && $('[data-cursor]')) {
  const c = document.createElement('div'); c.className = 'mo-cursor'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
  const cx = gsap.quickTo(c, 'x', { duration: .45, ease: 'power3' }); const cy = gsap.quickTo(c, 'y', { duration: .45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { c.textContent = el.dataset.cursor; c.classList.add('is-on'); });
    el.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  });
}

/* tilt */
if (fine) $$('[data-tilt]').forEach((el) => {
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5; const py = (e.clientY - r.top) / r.height - .5; gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: .5 }); });
  el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
});

/* counters */
$$('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count); const obj = { v: 0 };
  gsap.to(obj, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' }, onUpdate: () => { el.firstChild.nodeValue = Math.round(obj.v).toLocaleString('en-US'); } });
});

/* sticker / ring spin-in */
$$('[data-pop]').forEach((el) => gsap.from(el, { scale: 0, rotate: -90, duration: 1.2, ease: 'elastic.out(1,.5)', scrollTrigger: { trigger: el, start: 'top 92%' } }));

initPageLogic(gsap);

/* =========================================================
   PAGE LOGIC
   ========================================================= */
function initPageLogic(g) {
  keepTogether();
  justifyThai();
  heroShow();
  heroCarousel(g);
  heroArcs(g);
  reel(g);
  rail();
  menuFilter(g);
  countdown();
  timeline(g);
  storeMap();
}

/* ---------- Thai line breaks: keep phrases whole ----------
   The browser breaks Thai between dictionary words, so "เปิดทุก / วัน", "18:00 – / 21:00 น." or a branch name
   could split across lines. These phrases, times, dates and number + unit pairs are wrapped in a no-wrap span.
   Skips flex/grid parents (a new span there becomes its own item with gaps around it) and split headings. */
function keepTogether() {
  const months = 'มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม';
  const units = 'แหล่งปลูก|แหล่ง|รายการ|สาขา|เมนู|แก้ว|กรัม|ชั่วโมง|ชม\\.|นาที|วินาที|วัน|ปี|โมงตรง|โมง|คน|บาท|ชิ้น|ที่นั่ง|ขึ้นไป';
  const words = [
    'เปิดทุกวัน', 'ทุกวันศุกร์', 'ทุกเสาร์–อาทิตย์', 'เสาร์–อาทิตย์', 'ทุกสัปดาห์', 'ทุกวัน', 'ทุกแก้ว', 'ทุกช็อต',
    'สั่งเดลิเวอรี', 'เดลิเวอรี', 'ดูเส้นทาง', 'ใกล้คุณ', 'สเปเชียลตี้', 'สเปเชียลตี', 'ลาเต้อาร์ต', 'เอสเพรสโซ',
    'ครัวซองต์', 'บาริสต้า', 'คัปปิ้ง', 'โฮมบรูว์', 'ซิงเกิลออริจิน', 'มาสคาร์โปเน', 'โรงคั่ว', 'เมล็ดกาแฟ', 'ร้านกาแฟ',
    'กรุงเทพฯ', 'นนทบุรี', 'Shogun Coffee', 'LINE MAN',
    'ทุกเช้า', 'ทีละแก้ว', 'ทีละช็อต', 'ของขวัญ', 'ซีเล็คชั่น', 'ตอบกลับ', 'ทุกคำถาม', 'ลายสวย',
    'แหล่งปลูก', 'ต่อหน้า', 'อบแห้ง', 'ออกเตา', 'แก้วโปรด', 'เย็นจัด', 'ผงโกโก้', 'ฟรอสติ้ง', 'ครัมเบิล', 'มาสคาโปน',
    'คอกาแฟ', 'ส่งมอบ', 'น้ำหนัก', 'เบเกอรี่', 'เบเกอรี', 'ของเรา', 'พิถีพิถัน', 'สุนทรียรส', 'โฮมเมด', 'ซิกเนเจอร์',
    'ช็อกโกแลต', 'คาราเมล', 'วอลนัต', 'กัวเตมาลา', 'เอธิโอเปีย', 'โคลอมเบีย',
    ...['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((d) => 'วัน' + d),
    ...['อารีย์', 'สยาม', 'ทองหล่อ', 'สีลม', 'ปิ่นเกล้า', 'ลาดพร้าว', 'นวมินทร์', 'บางนา', 'นนทบุรี'].map((b) => 'สาขา' + b),
  ].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp([
    '\\d{1,2}[:.]\\d{2}\\s*[–-]\\s*\\d{1,2}[:.]\\d{2}(?:\\s*น\\.)?', // 18:00 – 21:00 น.
    '\\d{1,2}[:.]\\d{2}\\s*น\\.', // 08:00 น.
    `\\d{1,2}(?:\\s*[–-]\\s*\\d{1,2})?\\s*(?:${months})(?:\\s*\\d{4})?`, // 4 – 25 ธันวาคม 2026
    'พ\\.ศ\\.\\s*\\d{4}',
    `\\d[\\d,]*(?:\\s*[–-]\\s*\\d[\\d,]*)?\\s*(?:${units})`, // 27 รายการ, 50–200 คน
    'ซอย[ก-๙]+\\s*\\d+',
    ...words,
  ].join('|'), 'g');
  const test = new RegExp(pattern.source); // no g flag: test() must not remember lastIndex
  const root = $('.mo-main') || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || !test.test(n.nodeValue) || p.closest('script,style,.kt,.sr-only,select,option,textarea')) return NodeFilter.FILTER_REJECT;
      return /flex|grid/.test(getComputedStyle(p).display) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const frag = document.createDocumentFragment(); let last = 0; const v = n.nodeValue;
    v.replace(pattern, (m, ...rest) => {
      const at = rest[rest.length - 2];
      if (at > last) frag.append(v.slice(last, at));
      const s = document.createElement('span'); s.className = 'kt'; s.textContent = m; frag.append(s);
      last = at + m.length; return m;
    });
    if (last < v.length) frag.append(v.slice(last));
    n.replaceWith(frag);
  });
}

/* ---------- Thai paragraphs: even left and right edges ----------
   Only left-aligned paragraphs that contain Thai and run over more than one line; centred text stays centred.
   Re-checked on resize because a paragraph can go from one line to two. */
function justifyThai() {
  const run = () => {
    $$('.mo-main p, .mo-main .lead, .mo-main li, .mo-main dd, .mo-main figcaption').forEach((el) => {
      if (!/[฀-๿]/.test(el.textContent) || el.closest('nav, button, .btn, .hero')) return;
      el.classList.remove('jt', 'bal');
      const s = getComputedStyle(el);
      // Centred text: balance the lines instead (no long line over a short one).
      if (s.textAlign === 'center') { el.classList.add('bal'); return; }
      if (!['start', 'left', 'justify'].includes(s.textAlign)) return;
      const lines = Math.round(el.getBoundingClientRect().height / (parseFloat(s.lineHeight) || 24));
      if (lines < 2) return;
      // Thai has few spaces, so justifying can open wide holes. Try it, measure every space, and keep it only
      // when no gap grows wider than about one character.
      el.classList.add('jt');
      const limit = (parseFloat(s.fontSize) || 16) * 0.95;
      const range = document.createRange(); const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let tooWide = false;
      while (!tooWide && walk.nextNode()) {
        const t = walk.currentNode;
        for (let i = 0; i < t.nodeValue.length && !tooWide; i++) {
          if (t.nodeValue[i] !== ' ') continue;
          range.setStart(t, i); range.setEnd(t, i + 1);
          const r = range.getClientRects()[0];
          if (r && r.width > limit) tooWide = true;
        }
      }
      if (tooWide) el.classList.remove('jt');
    });
  };
  run();
  document.fonts && document.fonts.ready.then(run);
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 200); });
}

/* ---------- home: full-screen photo hero ----------
   One photo at a time, cross-fading every few seconds (CSS does the fade and the slow zoom).
   Runs with animations off too, as a plain fade. Pauses while the tab is hidden. */
function heroShow() {
  const hero = $('[data-hero-show]');
  if (!hero) return;
  const slides = $$('.hero__slide', hero); const bars = $$('[data-hero-go]', hero);
  if (slides.length < 2) return;
  const dwell = 6000; hero.style.setProperty('--hero-dwell', `${dwell / 1000}s`);
  let i = 0; let timer = null;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
    // Restart the bar animation on the current bar.
    bars.forEach((b, k) => { b.removeAttribute('aria-current'); if (k === i) { void b.offsetWidth; b.setAttribute('aria-current', 'true'); } });
  };
  const start = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), dwell); };
  bars.forEach((b, k) => b.addEventListener('click', () => { show(k); start(); }));
  // Only run while the hero is on screen and the tab is visible (big photos cost battery off screen).
  let onScreen = true;
  const sync = () => { if (onScreen && !document.hidden) start(); else clearInterval(timer); };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  start();
}

/* ---------- home: hero latte art ----------
   With motion: the hero pins while you scroll, and each latte pattern "melts" into the next
   (SVG turbulence displacement + counter-rotation), holding briefly on every pattern.
   Without motion (reduced / no GSAP): falls back to a timed crossfade. */
function heroCarousel(g) {
  const stage = $('[data-hero-stage]');
  if (!stage) return;
  const prods = $$('.hero__prod', stage);
  const nameEl = $('[data-hero-name]'); const priceEl = $('[data-hero-price]'); const dotsEl = $('[data-hero-dots]');
  let i = 0; let timer; let goTo = null;
  const dots = prods.map((p, n) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', p.dataset.name);
    b.addEventListener('click', () => { if (goTo) goTo(n); else { show(n); restart(); } }); dotsEl.appendChild(b); return b;
  });
  if (g && !reduce && window.ScrollTrigger && prods.length > 1) { latteScrub(); return; }

  function latteScrub() {
    const hero = stage.closest('.hero');
    const disp = $('#latte-melt feDisplacementMap');
    const n = prods.length; const segs = n - 1;
    stage.classList.add('is-scrub');
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
    const render = (p) => {
      // hold on each pattern: only the middle 60% of every segment animates
      const u = Math.min(p * segs, segs - 1e-6);
      const k = Math.floor(u);
      const t = ease(Math.min(1, Math.max(0, (u - k - 0.2) / 0.6)));
      prods.forEach((im, idx) => {
        let o = 0; let r = 0; let s = 1;
        if (idx === k) { o = 1 - t; r = -80 * t; s = 1 + 0.15 * t; }
        else if (idx === k + 1) { o = t; r = 80 * (1 - t); s = 1.15 - 0.15 * t; }
        im.style.opacity = o.toFixed(3);
        im.style.transform = `rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      });
      // melt the pictures inside the clipped circle (filter on the images, so the round edge stays crisp)
      const melt = Math.sin(Math.PI * t) * 80;
      if (disp) disp.setAttribute('scale', melt.toFixed(1));
      prods.forEach((im) => { im.style.filter = melt > 0.5 && im.style.opacity !== '0.000' ? 'url(#latte-melt)' : 'none'; });
      const now = Math.round(k + t);
      if (now !== i) { i = now; sync(); }
    };
    const st = window.ScrollTrigger.create({
      trigger: hero, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 1.8),
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => render(self.progress),
    });
    goTo = (idx) => {
      const y = st.start + (st.end - st.start) * (idx / segs);
      if (window.moLenis) window.moLenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    render(0); sync();
  }
  function show(n) {
    if (n === i) { sync(); return; }
    const prev = prods[i]; prev.classList.remove('is-active'); prev.classList.add('is-leaving');
    setTimeout(() => prev.classList.remove('is-leaving'), 700);
    i = n; prods[i].loading = 'eager'; prods[i].classList.add('is-active'); sync();
  }
  function sync() { nameEl.textContent = prods[i].dataset.name; priceEl.textContent = prods[i].dataset.price; dots.forEach((d, n) => d.setAttribute('aria-current', String(n === i))); }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show((i + 1) % prods.length), 3600); }
  prods.forEach((p) => { const im = new Image(); im.src = p.src; });
  sync(); restart();
  document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : restart()));
}

/* ---------- home: curved type follows scroll + drifts ---------- */
function heroArcs(g) {
  const arcs = $$('[data-arc]');
  if (!arcs.length || reduce) return;
  let drift = 0; let y = window.scrollY;
  window.addEventListener('scroll', () => { y = window.scrollY; }, { passive: true });
  const tick = (t, dt = 16) => {
    drift += dt * 0.03;
    if (y < window.innerHeight * 1.3) arcs.forEach((tp) => {
      const a = tp.dataset.arc === 'a';
      tp.setAttribute('startOffset', ((a ? 0 : -1400) + (a ? -1 : 1) * (y * 0.9 + drift)).toFixed(1));
    });
  };
  if (g) g.ticker.add(tick); else { const loop = () => { tick(0, 16); requestAnimationFrame(loop); }; loop(); }
}

/* ---------- home: pinned horizontal video reel ---------- */
function reel(g) {
  const sec = $('[data-reel]');
  if (!sec) return;
  // Animations off (or no GSAP): nothing drives the track, so it becomes a normal sideways scroller
  // with arrows, mouse drag and the progress bar (CSS: .reel--native).
  if (!g) { reelNative(sec); return; }
  const mm = g.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('.reel__track', sec); const bar = $('.reel__progress i', sec);
    const dist = () => track.scrollWidth - window.innerWidth;
    const tw = g.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: '.reel__pin', scrub: 1, invalidateOnRefresh: true, onUpdate: (s) => g.set(bar, { scaleX: s.progress }) } });
    $$('.reel__panel', sec).forEach((p) => {
      g.from($('.reel__cap', p), { y: 60, opacity: 0, ease: 'expo.out', duration: 1, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 70%' } });
      g.fromTo($('video, img', p), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left right', end: 'center center', scrub: true } });
    });
    return () => {};
  });
}

function reelNative(sec) {
  const track = $('.reel__track', sec); const bar = $('.reel__progress i', sec);
  const prev = $('[data-reel-prev]', sec); const next = $('[data-reel-next]', sec);
  sec.classList.add('reel--native');
  const panels = () => $$('.reel__panel, .reel__end', track);
  // Scroll so the nearest panel in the given direction lines up with the track's left padding.
  const go = (dir) => {
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const lefts = panels().map((p) => p.offsetLeft - pad);
    const x = track.scrollLeft;
    const target = dir > 0 ? lefts.find((l) => l > x + 8) : [...lefts].reverse().find((l) => l < x - 8);
    track.scrollTo({ left: target ?? (dir > 0 ? track.scrollWidth : 0), behavior: 'smooth' });
  };
  prev && prev.addEventListener('click', () => go(-1));
  next && next.addEventListener('click', () => go(1));
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.max(.04, track.scrollLeft / max) : 1})`;
    if (prev) prev.disabled = track.scrollLeft < 4;
    if (next) next.disabled = track.scrollLeft > max - 4;
  };
  track.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
  // Mouse drag.
  let down = false; let sx = 0; let sl = 0; let moved = false;
  track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-dragging'); } if (moved) track.scrollLeft = sl - dx; });
  const snapNearest = () => {
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const lefts = panels().map((p) => p.offsetLeft - pad);
    const x = track.scrollLeft;
    const nearest = lefts.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a), 0);
    track.scrollTo({ left: nearest, behavior: 'smooth' });
  };
  window.addEventListener('pointerup', () => { if (!down) return; down = false; if (moved) { track.classList.remove('is-dragging'); snapNearest(); } });
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
}

/* ---------- home: highlight rail ---------- */
function rail() {
  const r = $('[data-rail]');
  if (!r) return;
  const prev = $('[data-rail-prev]'); const next = $('[data-rail-next]'); const bar = $('[data-rail-bar]');
  const step = () => ($('.hcard', r)?.getBoundingClientRect().width || 300) + 20;
  prev.addEventListener('click', () => r.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
  next.addEventListener('click', () => r.scrollBy({ left: step() * 2, behavior: 'smooth' }));
  const update = () => {
    const max = r.scrollWidth - r.clientWidth; const ratio = r.clientWidth / r.scrollWidth;
    bar.style.width = `${Math.max(ratio * 100, 12)}%`;
    bar.style.transform = `translateX(${max > 0 ? (r.scrollLeft / max) * ((1 / Math.max(ratio, 0.12)) - 1) * 100 : 0}%)`;
    prev.disabled = r.scrollLeft < 4; next.disabled = r.scrollLeft > max - 4;
  };
  r.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
  let down = false; let sx = 0; let sl = 0; let moved = false;
  r.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = r.scrollLeft; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) > 6) { moved = true; r.classList.add('is-dragging'); } if (moved) r.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; if (moved) { r.classList.remove('is-dragging'); const w = step(); r.scrollTo({ left: Math.round(r.scrollLeft / w) * w, behavior: 'smooth' }); } });
  r.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  r.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); } });
  r.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  r.setAttribute('data-lenis-prevent-horizontal', '');
}

/* ---------- menu: filter with FLIP ---------- */
function menuFilter(g) {
  const grid = $('[data-mgrid]');
  if (!grid) return;
  const chips = $$('[data-filter]'); const cards = $$('.mcard', grid); const countEl = $('[data-mcount]');
  let flipTl = null;
  function apply(cat, animate = true) {
    if (flipTl) { flipTl.progress(1).kill(); flipTl = null; g && g.set(cards, { clearProps: 'opacity,scale,transform' }); }
    const state = g && animate ? window.Flip.getState(cards) : null;
    let n = 0;
    cards.forEach((c) => { const show = cat === 'all' || c.dataset.cat === cat; c.hidden = !show; if (show) n += 1; });
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
    if (countEl) countEl.textContent = n;
    if (state) flipTl = window.Flip.from(state, { duration: .7, ease: 'expo.out', scale: true, absolute: true, stagger: .015, onEnter: (els) => g.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out' }), onLeave: (els) => g.to(els, { opacity: 0, scale: .85, duration: .3 }), onComplete: () => window.ScrollTrigger && window.ScrollTrigger.refresh() });
  }
  chips.forEach((b) => b.addEventListener('click', () => {
    apply(b.dataset.filter);
    history.replaceState(null, '', b.dataset.filter === 'all' ? location.pathname : `#${b.dataset.filter}`);
  }));
  const fromHash = { bites: 'dessert' }[location.hash.slice(1)] || location.hash.slice(1);
  apply(chips.some((b) => b.dataset.filter === fromHash) ? fromHash : 'all', false);
  if (fromHash && g) setTimeout(() => { const nav = $('.mnav'); if (window.moLenis && nav) window.moLenis.scrollTo(nav, { offset: 0, immediate: false }); }, 700);
}

/* ---------- events: live countdown ---------- */
function countdown() {
  const el = $('[data-countdown]');
  if (!el) return;
  const dates = el.dataset.countdown.split(',').map((d) => new Date(d));
  const out = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
  const label = $('[data-cd-label]', el);
  const tick = () => {
    const now = new Date();
    const next = dates.find((d) => d.getTime() + 3 * 3600e3 > now.getTime());
    if (!next) { label.textContent = 'ขอบคุณที่มาร่วมงาน — พบกันใหม่รอบหน้า'; return; }
    let diff = Math.max(0, next - now);
    if (diff === 0) { label.textContent = 'กำลังจัดงานอยู่ตอนนี้ แวะมาได้เลย'; }
    else label.textContent = `รอบถัดไป ${next.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    const d = Math.floor(diff / 864e5); diff -= d * 864e5; const h = Math.floor(diff / 36e5); diff -= h * 36e5; const m = Math.floor(diff / 6e4); const s = Math.floor((diff - m * 6e4) / 1000);
    out.d.textContent = String(d).padStart(2, '0'); out.h.textContent = String(h).padStart(2, '0'); out.m.textContent = String(m).padStart(2, '0'); out.s.textContent = String(s).padStart(2, '0');
  };
  tick(); setInterval(tick, 1000);
}

/* ---------- about: timeline line draws with scroll ---------- */
function timeline(g) {
  const tl = $('[data-timeline]');
  if (!tl || !g) return;
  g.to($('.timeline__line i', tl), { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 60%', scrub: true } });
}

/* ---------- map page ---------- */
function storeMap() {
  const box = $('[data-stores]');
  if (!box) return;
  const stores = JSON.parse(box.textContent);
  const list = $('[data-store-list]'); const input = $('[data-store-search]'); const meta = $('[data-store-meta]');
  const gmaps = (s) => `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
  const items = stores.map((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="mp__store" data-id="${s.id}"><i>${String(i + 1).padStart(2, '0')}</i><span><b>${s.name}</b><small>${s.district} · ${s.province}</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`;
    list.appendChild(li); return { s, li, btn: li.firstChild };
  });
  let map = null; const markers = {};
  const popup = (s) => `<div class="mo-pop"><b>${s.name}</b><small>${s.district} · ${s.province} · เปิด 08:00–19:00</small><div class="mo-pop__btns"><a href="${gmaps(s)}" target="_blank" rel="noopener">นำทาง</a><a href="${s.delivery.grabUrl}" target="_blank" rel="noopener">Grab</a><a href="${s.delivery.lineManUrl}" target="_blank" rel="noopener">LINE MAN</a></div></div>`;
  function select(id, fly = true) {
    items.forEach(({ s, btn }) => btn.setAttribute('aria-current', String(s.id === id)));
    Object.entries(markers).forEach(([k, m]) => m.getElement()?.querySelector('.mo-pin')?.classList.toggle('is-active', Number(k) === id));
    const s = stores.find((x) => x.id === id);
    if (map && s && fly) { map.flyTo([s.lat, s.lng], 15, { duration: 1.2 }); markers[id].openPopup(); }
  }
  items.forEach(({ s, btn }) => btn.addEventListener('click', () => select(s.id)));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase(); let n = 0;
    items.forEach(({ s, li }) => { const ok = !q || `${s.name} ${s.district} ${s.province}`.toLowerCase().includes(q); li.hidden = !ok; if (ok) n += 1; });
    meta.textContent = q ? `พบ ${n} สาขา จากทั้งหมด ${stores.length}` : `ทั้งหมด ${stores.length} สาขา`;
  });
  meta.textContent = `ทั้งหมด ${stores.length} สาขา`;
  const el = document.getElementById('leaflet-map');
  const fail = () => { el.innerHTML = '<a href="https://www.google.com/maps/search/?api=1&query=Shogun+Coffee" target="_blank" rel="noopener" style="display:flex;height:100%;align-items:center;justify-content:center;color:#12221B">เปิดแผนที่สาขาใน Google Maps ↗</a>'; };
  const sc = document.createElement('script');
  sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onerror = fail;
  sc.onload = () => {
    const L = window.L;
    map = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([13.76, 100.55], 11);
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
    L.tileLayer(esri + 'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 16 }).addTo(map);
    L.tileLayer(esri + 'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
    const icon = L.divIcon({ html: '<div class="mo-pin"><img src="img/emblem-gold.svg" alt=""></div>', className: '', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -40] });
    stores.forEach((s) => { markers[s.id] = L.marker([s.lat, s.lng], { icon, title: s.name }).addTo(map).bindPopup(popup(s)).on('click', () => select(s.id, false)); });
    map.fitBounds(L.latLngBounds(stores.map((s) => [s.lat, s.lng])), { padding: [40, 40] });
    el.addEventListener('pointerdown', () => map.scrollWheelZoom.enable(), { once: true });
  };
  document.head.appendChild(sc);
}
})();
