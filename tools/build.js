// Shogun Coffee — builds all six pages ("Roastery Warm" CI B)
const fs = require('fs');
const path = require('path');
const SITE = 'D:/SOFT Z DIGITAL/03_เทมเพลต Soft Z/Shogun Matcha/ShogunCoffee-Website/';
const BK = 'D:/SOFT Z DIGITAL/03_เทมเพลต Soft Z/Shogun Matcha/_backup_ShogunCoffee/';
const DATA = path.join(__dirname, '../data/');
const stores = JSON.parse(fs.readFileSync(DATA + 'stores.json', 'utf8'));
const V = 'v=7';
const { recolor } = require('./recolor.js');

/* ---------- menu: only items with a strong photo; bites merged into bakery ---------- */
const rawMenu = JSON.parse(fs.readFileSync(DATA + 'menu.json', 'utf8'));
const phOf = (img) => img.replace('img/p-', '').replace('.webp', '');
const hasPh = (n) => fs.existsSync(SITE + 'img/ph/' + n + '.webp');
const menu = rawMenu.filter((s) => s.id !== 'bites').map((s) => ({
  ...s,
  en: s.id === 'dessert' ? 'Bakery &amp; Bites' : s.en,
  th: s.id === 'dessert' ? 'ขนมอบและของว่าง' : s.th,
  items: [...s.items, ...(s.id === 'dessert' ? rawMenu.find((x) => x.id === 'bites').items : [])]
    .filter((it) => hasPh(phOf(it.img))).map((it) => ({ ...it, ph: phOf(it.img) })),
})).filter((s) => s.items.length);
const total = menu.reduce((n, s) => n + s.items.length, 0);

/* ---------- original nav + footer per page ---------- */
const srcOf = { index: 'index-before-redesign.html', menu: 'menu.html', events: 'events.html', map: 'map.html', about: 'about.html', contact: 'contact.html' };
function chrome(page) {
  const h = fs.readFileSync(BK + srcOf[page], 'utf8');
  const nav = h.slice(h.indexOf('<shogun-navigation'), h.indexOf('</shogun-navigation>') + '</shogun-navigation>'.length)
    .replace(/href="index\.html#best-sellers"/g, 'href="menu.html#signature"');
  const footer = h.slice(h.indexOf('<footer'), h.lastIndexOf('</body>'))
    .replace(/href="index\.html#best-sellers"/g, 'href="menu.html#signature"')
    .replace(/href="index\.html#shogun-collection"/g, 'href="index.html#bean-box"')
    .replace('&copy; 2026 SOFT Z All rights reserved.', '&copy; 2026 Shogun Coffee สงวนลิขสิทธิ์');
  if (!nav.includes('delivery-options') || !footer.includes('back-to-top')) throw new Error('chrome missing ' + page);
  return { nav, footer };
}

/* ---------- helpers ---------- */
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const arrowUp = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ph = (name, alt = '', { cls = '', speed = '' } = {}) => `<div class="ph ${cls}"><img src="img/ph/${name}.webp" alt="${alt}" loading="lazy" decoding="async"${speed ? ` data-speed="${speed}"` : ''}></div>`;
const vid = (name, { badge = '' } = {}) => `<div class="vid"><img src="video/p-${name}.webp" alt="" loading="lazy"><video data-src="video/v-${name}.mp4" poster="video/p-${name}.webp" muted loop playsinline preload="none" aria-hidden="true"></video>${badge ? `<span class="vid__badge"><i></i>${badge}</span>` : ''}</div>`;
let ringN = 0;
// r = 76 → circumference ≈ 477.5; textLength makes any phrase fill the circle exactly (no overlap)
const ring = (text, cls) => { const id = `ring-${++ringN}`; return `<div class="sz-ring ${cls}" data-pop aria-hidden="true"><svg viewBox="0 0 200 200"><defs><path id="${id}" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs><circle cx="100" cy="100" r="98" fill="#3B2418"/><circle cx="100" cy="100" r="93" fill="none" stroke="#FBF6EE" stroke-opacity=".25"/><text fill="#FBF6EE" font-family="'TAN Mon Cheri',serif" font-size="15"><textPath href="#${id}" textLength="474" lengthAdjust="spacing">${text}</textPath></text></svg><img src="img/emblem-gold.svg" alt=""></div>`; };
const shead = (eyebrow, display, { center = false, extra = '', id = '' } = {}) => `<div class="shead${center ? ' shead--center' : ''}"><h2 class="shead__t"${id ? ` id="${id}"` : ''}><span class="eyebrow rv">${eyebrow}</span><span class="display" data-split>${display}</span></h2>${extra}</div>`;
const deliveryBtn = (cls = 'btn--caramel', label = 'สั่งเดลิเวอรี') => `<button type="button" class="btn ${cls} delivery-trigger" aria-controls="delivery-options" aria-expanded="false" aria-haspopup="dialog" data-magnetic>${label} ${arrow}</button>`;

function layout(page, { title, desc, main, head = '' }) {
  const { nav, footer } = chrome(page);
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" type="image/svg+xml" href="img/favicon.svg"><title>${title}</title>
<meta name="description" content="${desc}"><meta name="theme-color" content="#12221B">
<link rel="preload" href="fonts/TAN-MON-CHERI-Regular.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="fonts/ShipporiMincho-Bold.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="fonts/mitr/mitr-300-thai.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/site.css?v=12"><link rel="stylesheet" href="css/shogun.css?v=12"><link rel="stylesheet" href="css/fonts.css?${V}">${head}<link rel="stylesheet" href="css/motion.css?${V}">
<script>document.documentElement.classList.add('js')</script>
</head><body class="mo flex flex-col min-h-screen"><div class="mo-curtain" aria-hidden="true"><img src="img/emblem-gold.svg" alt=""></div><div class="flex-1 w-full">${nav}<script defer src="js/nav.js?v=12"></script>
<main id="main" class="mo-main">
${main}
</main></div>${footer}
<script defer src="js/vendor/gsap.min.js"></script><script defer src="js/vendor/ScrollTrigger.min.js"></script><script defer src="js/vendor/SplitText.min.js"></script><script defer src="js/vendor/Flip.min.js"></script><script defer src="js/vendor/lenis.min.js"></script>
<script defer src="js/motion.js?${V}"></script>
</body></html>
`;
}

const cta = ({ eyebrow, title, text, btns, tone = 'tone-dark' }) => `
<section class="cta ${tone}" aria-label="${eyebrow.replace(/<[^>]+>/g, '')}">
  <div class="wrap cta__t"><span class="eyebrow rv">${eyebrow}</span><h2 class="display" data-split${tone === 'tone-dark' ? '' : ' style="color:var(--espresso)"'}>${title}</h2><p class="lead rv">${text}</p><div class="cta__btns rv">${btns}</div></div>
</section>`;

const phero = ({ eyebrow, title, th, lead, btns = '' }) => `
<section class="phero">
  <div class="wrap phero__t">
    <span class="eyebrow rv">${eyebrow}</span>
    <h1 class="display" data-split data-split-now>${title}</h1>
    ${th ? `<p class="th-sub rv">${th}</p>` : ''}
    <p class="lead rv">${lead}</p>
    ${btns ? `<div class="phero__btns rv">${btns}</div>` : ''}
  </div>
</section>`;

/* =========================================================
   HOME
   ========================================================= */
function home() {
  const hcards = [
    ['Signature', 'Kuro Dirty', 'ริสเตรตโตร้อนรินบนนมสดเย็นจัด ไหลเป็นลายสวย ดื่มทันที', 'special-dirty', 'menu.html#signature'],
    ['Seasonal', 'Orange Brew', 'โคลด์บรูว์บนน้ำส้มคั้นสด ใส่ส้มอบแห้ง หอม สดชื่นรับหน้าร้อน', 'special-orange', 'menu.html#signature'],
    ['New crop', 'Ethiopia Guji 2026', 'เมล็ดล็อตใหม่ประจำฤดูกาล หอมดอกมะลิ เบอร์รี่ และชาดำ', 'w-about-2', 'menu.html#slow-bar'],
    ['Daily', 'Fresh from the oven', 'ครัวซองต์เนยฝรั่งเศส อบใหม่ออกเตาทุกเช้า 8 โมงตรง', 'croissant', 'menu.html#dessert'],
    ['Event', 'Cupping Night', 'ชิมกาแฟ 5 แหล่งปลูกกับคนคั่วของเรา ทุกวันศุกร์ในเดือนธันวาคม', 'w-about-1', 'events.html'],
    ['Slow bar', 'Hand Brew', 'ดริปมือทีละแก้วด้วยกรวยเซรามิก เลือกเมล็ดตามฤดูกาลได้', 'hand-brew', 'menu.html#slow-bar'],
    ['Dessert', 'Tiramisu', 'มาสคาร์โปเนเนื้อนุ่ม ชุ่มเอสเพรสโซ โรยโกโก้และช็อกโกแลตขูด', 'tiramisu', 'menu.html#dessert'],
  ].map(([chip, t, x, img, href]) => `<a class="hcard" href="${href}" draggable="false" data-cursor="View"><img src="img/ph/${img}.webp" alt="" loading="lazy" decoding="async" draggable="false"><div class="hcard__top"><span class="chip chip--cream">${chip}</span></div><span class="hcard__go">${arrowUp}</span><div class="hcard__body"><h3 class="hcard__title">${t}</h3><p class="hcard__text">${x}</p></div></a>`).join('\n    ');

  const catCount = (id) => menu.find((s) => s.id === id)?.items.length || 0;
  const cats = [['Signature', 'ซิกเนเจอร์', 'special-dirty', 'signature'], ['Espresso Bar', 'กาแฟเอสเพรสโซ', 'latte', 'coffee'], ['Slow Bar', 'ดริปทีละแก้ว', 'hand-brew', 'slow-bar'], ['Non-Coffee', 'ไม่ใช่กาแฟ', 'chai', 'non-coffee'], ['Bakery', 'ขนมอบและของว่าง', 'croissant', 'dessert']]
    .map(([en, th, img, id]) => `<li class="rv"><a class="cat" href="menu.html#${id}">${ph(img)}<span class="cat__name"><b>${en}</b><span>${th} · ${catCount(id)} เมนู</span></span></a></li>`).join('\n      ');


  const reelPanels = [
    ['01', 'Roast', 'beans', 'คั่วเองทุกสัปดาห์ที่โรงคั่วของเรา เลือกโปรไฟล์ให้เข้ากับเมล็ดแต่ละล็อต'],
    ['02', 'Grind &amp; Tamp', 'tamping', 'บดสดก่อนชงทุกช็อต ชั่งน้ำหนักและจับเวลาตามสูตรของร้าน'],
    ['03', 'Pour', 'latte-art', 'สตีมนมเนื้อเนียน วาดลาเต้อาร์ตทีละแก้วต่อหน้าคุณ'],
    ['04', 'Serve', 'pouring', 'เสิร์ฟพร้อมขนมอบที่จับคู่รสชาติมาแล้วว่าเข้ากัน'],
  ].map(([n, t, v, p]) => `<article class="reel__panel">${vid(v)}<span class="reel__num">${n}</span><div class="reel__cap"><h3>${t}</h3><p>${p}</p></div></article>`).join('\n      ');

  const main = `
<!-- HERO -->
<section class="hero hero--show" aria-label="Shogun Coffee" data-hero-show>
  <div class="hero__slides">
    <picture class="hero__slide is-on"><source media="(max-width:760px)" srcset="img/hero/h1-m.webp"><img src="img/hero/h1.webp" alt="มุมนั่งโซฟาหนังกับโต๊ะไม้ ผนังระแนงไม้โทนเข้ม" width="2560" height="1715" fetchpriority="high"></picture>
    <picture class="hero__slide"><source media="(max-width:760px)" srcset="img/hero/h2-m.webp"><img src="img/hero/h2.webp" alt="บาร์กาแฟโทนเข้มพร้อมเก้าอี้สตูล" width="2560" height="1434" decoding="async"></picture>
    <picture class="hero__slide"><source media="(max-width:760px)" srcset="img/hero/h3-m.webp"><img src="img/hero/h3.webp" alt="บาริสต้าหลังเคาน์เตอร์บาร์กาแฟ" width="2560" height="1706" decoding="async"></picture>
    <picture class="hero__slide"><source media="(max-width:760px)" srcset="img/hero/h4-m.webp"><img src="img/hero/h4.webp" alt="บาริสต้ากำลังชงเครื่องดื่มที่เครื่องเอสเพรสโซ" width="2560" height="1706" decoding="async"></picture>
    <picture class="hero__slide"><source media="(max-width:760px)" srcset="img/hero/h5-m.webp"><img src="img/hero/h5.webp" alt="ถ้วยเอสเพรสโซบนเครื่องชงกาแฟ" width="2560" height="1705" decoding="async"></picture>
  </div>
  <div class="hero__veil" aria-hidden="true"></div>
  <h1 class="hero__brand"><span class="sr-only">Shogun Coffee — </span><span class="hero__kicker">Coffee Roasters · Since 2016</span><span class="hero__line">กาแฟคั่วเองทุกสัปดาห์</span></h1>
  <div class="hero__bars" role="group" aria-label="เลือกภาพ"><button type="button" data-hero-go="0" aria-label="ภาพที่ 1" aria-current="true"></button><button type="button" data-hero-go="1" aria-label="ภาพที่ 2"></button><button type="button" data-hero-go="2" aria-label="ภาพที่ 3"></button><button type="button" data-hero-go="3" aria-label="ภาพที่ 4"></button><button type="button" data-hero-go="4" aria-label="ภาพที่ 5"></button></div>
</section>

<!-- INTRO -->
<section class="intro tone-dark" aria-labelledby="intro-title">
  <h2 id="intro-title" class="sr-only">Roasted, Crafted, Shared</h2>
  <div class="intro__words" aria-hidden="true">
    <span class="intro__word" data-progress data-range="top 95%,top 45%">Roasted</span>
    <span class="intro__word" data-progress data-range="top 95%,top 45%">Crafted</span>
    <span class="intro__word" data-progress data-range="top 95%,top 45%">Shared</span>
  </div>
  <div class="wrap">
    <span class="eyebrow rv">Shogun / Since 2016</span>
    <p class="intro__lead" data-split="lines">ยินดีต้อนรับสู่ <em>Shogun Coffee</em> คาเฟ่และโรงคั่วเล็ก ๆ ที่คั่วเมล็ดเองทุกสัปดาห์ คัดสารจากไร่ที่เรารู้จักชื่อเจ้าของ ตั้งแต่ปี พ.ศ. 2559</p>
    <a class="link-line rv" href="about.html">เรื่องราวของเรา ${arrow}</a>
  </div>
</section>

<!-- FEATURE -->
<section class="feature tone-cream" aria-labelledby="feature-title">
  <div class="wrap">
    <div class="feature__card img-reveal">
      ${ph('w-cherries', 'เชอร์รีกาแฟสุกบนต้น', { speed: '0.1' })}
      <div class="feature__panel rv">
        <span class="eyebrow">Shogun / Origin</span>
        <h2 id="feature-title" class="feature__title">What is Specialty?</h2>
        <p>กาแฟสเปเชียลตี้คือเมล็ดที่ผ่านการคัปปิ้งได้คะแนน 80 ขึ้นไปตามมาตรฐาน SCA รู้ที่มาถึงระดับไร่ เก็บเฉพาะผลที่สุกพอดี จึงมีรสชาติเฉพาะตัวที่เล่าเรื่องของแหล่งปลูกได้ในทุกแก้ว</p>
        <ul class="checks">${['คะแนนคัปปิ้ง 80+ ทุกล็อต', 'รู้แหล่งปลูกถึงระดับไร่', 'เก็บเชอร์รีสุกด้วยมือทีละผล', 'คั่วสดทุกสัปดาห์ ใช้ภายใน 30 วัน', 'ซื้อตรงจากเกษตรกรในราคาเป็นธรรม'].map((t) => `<li>${check}${t}</li>`).join('')}</ul>
      </div>
      ${ring('SPECIALTY · SINGLE ORIGIN · ROASTED WEEKLY · ', 'feature__ring')}
    </div>
    <p class="feature__caption rv">Every cup tells its origin <span>— กาแฟที่เล่าเรื่องได้ในทุกแก้ว</span></p>
  </div>
</section>

<!-- REEL -->
<section class="reel tone-dark" data-reel aria-labelledby="reel-title">
  <div class="reel__pin">
    <div class="wrap">${shead('Shogun / From Bean to Cup', 'From bean to cup', { id: 'reel-title' })}</div>
    <div class="reel__track">
      ${reelPanels}
      <div class="reel__end"><span class="eyebrow">Shogun / Your Ritual</span><p class="display">Your daily<br>ritual awaits</p><a class="btn btn--caramel" href="menu.html" data-magnetic>เลือกเมนูของคุณ ${arrow}</a></div>
    </div>
    <div class="reel__progress" aria-hidden="true"><i></i></div><div class="arrows reel__arrows"><button type="button" data-reel-prev aria-label="ขั้นตอนก่อนหน้า"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><button type="button" data-reel-next aria-label="ขั้นตอนถัดไป"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
  </div>
</section>

<!-- HIGHLIGHTS -->
<section class="highlights tone-cream" aria-labelledby="hl-title">
  <div class="wrap">${shead('Shogun / What\'s New', 'Highlights', { id: 'hl-title', extra: `<div class="arrows rv"><button type="button" data-rail-prev aria-label="เลื่อนไปก่อนหน้า"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><button type="button" data-rail-next aria-label="เลื่อนไปถัดไป">${arrow}</button></div>` })}</div>
  <div class="rail" data-rail tabindex="0" aria-label="ไฮไลท์ล่าสุด">
    ${hcards}
  </div>
  <div class="wrap"><div class="rail-progress" aria-hidden="true"><i data-rail-bar></i></div></div>
</section>

<!-- CATEGORIES -->
<section class="cats tone-latte" aria-labelledby="cat-title">
  <div class="wrap">${shead('Shogun / Our Menu', 'Choose your ritual', { id: 'cat-title', extra: `<a class="link-line rv" href="menu.html">ดูเมนูทั้งหมด ${total} รายการ ${arrow}</a>` })}
    <ul class="cats__list">
      ${cats}
    </ul>
  </div>
</section>

<!-- BREW -->
<section class="brew tone-cream" aria-labelledby="brew-title">
  <div class="wrap">
    <div class="brew__card rv">
      <div class="brew__media" data-cursor="Brew">${vid('pour-over', { badge: 'Slow Bar' })}
        <div class="brew__notes" aria-label="วิธีดริปกาแฟที่บ้าน 3 ขั้นตอน">
          <span class="eyebrow">Shogun / Slow Bar</span>
          <h3>Pour-over at home <em>3 simple steps</em></h3>
          <ol><li><b>01</b>Rinse the filter, add 15 g of fresh ground coffee.</li><li><b>02</b>Bloom with 30 g of hot water, wait 30 seconds.</li><li><b>03</b>Pour slowly in circles up to 250 g. Enjoy.</li></ol>
        </div>
      </div>
      <div class="brew__body">
        <span class="eyebrow">New crop · เมล็ดกาแฟคั่วสด</span>
        <h2 id="brew-title"><span class="display">Fresh roasted beans</span></h2>
        <p>คั่วจากโรงคั่วของเราเองทุกสัปดาห์ บดให้ตามอุปกรณ์ชงที่บ้าน ส่งถึงมือภายใน 7 วันหลังคั่ว</p>
        <div class="pills">${['เอธิโอเปีย', 'โคลอมเบีย', 'ดอยช้าง', 'เคนยา', 'กัวเตมาลา', 'House Blend'].map((x) => `<a href="menu.html#slow-bar">${x}</a>`).join('')}</div>
        ${ph('w-collection', 'ชุดบดกาแฟในกล่องของขวัญ', { cls: 'brew__photo' })}
        <div class="card-foot"><a class="btn btn--dark" href="menu.html#slow-bar" data-magnetic>ดูเมล็ดทั้งหมด ${arrow}</a></div>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="services tone-cream" aria-label="บริการของเรา">
  <div class="wrap services__grid">
    <article class="svc svc--work rv" data-cursor="Join">${vid('cappuccino')}
      <h2 class="svc__title"><span class="eyebrow">Shogun / Events</span><span class="display">Workshop</span><span class="th-sub">เวิร์กช็อปกาแฟ</span></h2>
      <div><p>คลาสลาเต้อาร์ต คัปปิ้ง และโฮมบรูว์ สำหรับมือใหม่ถึงบาริสต้า รับจำนวนจำกัดทุกรอบ ทุกเสาร์–อาทิตย์</p><a class="btn btn--cream" href="events.html" data-magnetic>ดูรายละเอียด ${arrow}</a></div>
    </article>
    <article class="svc svc--box rv" id="bean-box" aria-labelledby="box-title">
      <div class="box__head"><div><span class="eyebrow">Shogun / Gift</span><h2 id="box-title" class="box__title">Bake Box<span>เลือกขนมโปรดใส่กล่อง จัดได้ตามงบ</span></h2></div></div>
      <div class="box__picks"><figure class="box__pick"><div class="ph"><img src="img/ph/croissant.webp" alt="ครัวซองต์เนยฝรั่งเศสอบใหม่" loading="lazy"></div><figcaption><b>Croissant</b><span>85.-</span></figcaption></figure><figure class="box__pick"><div class="ph"><img src="img/ph/basque.webp" alt="บาสก์ชีสเค้กหน้าไหม้" loading="lazy"></div><figcaption><b>Basque Cheesecake</b><span>145.-</span></figcaption></figure><figure class="box__pick"><div class="ph"><img src="img/ph/tiramisu.webp" alt="ทีรามิสุโรยโกโก้" loading="lazy"></div><figcaption><b>Tiramisu</b><span>155.-</span></figcaption></figure></div>
      <div class="box__foot"><a class="btn btn--dark" href="contact.html" data-magnetic>สั่งทำ Bake Box ${arrow}</a></div>
    </article>
  </div>
</section>

<!-- LOCATIONS -->
<section class="locations" aria-labelledby="loc-title">
  ${ph('w-locations', 'หน้าร้านกาแฟยามค่ำคืน แสงไฟอบอุ่น', { speed: '0.14' })}
  <div class="wrap locations__head">
    <span class="eyebrow">Shogun / Store Locator</span>
    <h2 id="loc-title" class="locations__big" data-split>Locations</h2>
    <p class="locations__th rv">สาขาของเรา</p>
    <div class="branch-chips rv">${stores.map((s) => `<span>${s.name.replace(/^สาขา/, '').replace(/ \(.*/, '')}</span>`).join('')}</div>
  </div>
  <div class="wrap"><div class="locations__bar rv"><p>กำลังมองหาที่นั่งสบาย ๆ กับกาแฟแก้วโปรดอยู่ใช่ไหม? <b>Shogun Coffee มี ${stores.length} สาขา</b> ในกรุงเทพฯ และนนทบุรี พร้อมเติมพลังให้วันของคุณ</p><a class="btn btn--dark" href="map.html" data-magnetic>ค้นหาสาขา ${arrow}</a></div></div>
</section>`;
  return layout('index', { title: 'Shogun Coffee', desc: `Shogun Coffee คาเฟ่และโรงคั่วกาแฟสเปเชียลตี้ คั่วเมล็ดเองทุกสัปดาห์ ขนมอบใหม่ทุกเช้า ${stores.length} สาขาในกรุงเทพฯ และนนทบุรี`, main });
}

/* =========================================================
   MENU
   ========================================================= */
function menuPage() {
  const chips = [`<button type="button" data-filter="all" aria-pressed="true">ทั้งหมด <small>${total}</small></button>`]
    .concat(menu.map((s) => `<button type="button" data-filter="${s.id}" aria-pressed="false">${s.en} <small>${s.items.length}</small></button>`)).join('');
  const cards = menu.flatMap((s) => s.items.map((it) => `<article class="mcard" data-cat="${s.id}">${ph(it.ph, it.name)}${s.id === 'signature' ? '<span class="chip chip--caramel mcard__tag">Signature</span>' : ''}<div class="mcard__body"><div class="mcard__row"><h3>${it.name}</h3><span class="mcard__price">${it.price}</span></div><p>${it.desc}</p></div></article>`)).join('\n    ');
  const anchors = menu.map((s) => `<span id="${s.id}" class="sr-only">${s.en}</span>`).join('') + '<span id="bites" class="sr-only">Bites</span>';
  const main = `
${phero({ eyebrow: 'Shogun Coffee · Menu', title: 'Our Menu', th: 'กาแฟคั่วเอง ขนมอบทุกเช้า', lead: `${total} เมนูจากบาร์เอสเพรสโซ สโลว์บาร์ และครัวขนมอบของเรา เลือกหมวดที่ชอบแล้วดูเมนูได้ทันที`, video: 'pouring', sticker: `${total}<br>เมนู`, ringText: 'FRESHLY ROASTED · BAKED DAILY · SHOGUN · ', btns: deliveryBtn() + `<a class="btn btn--ghost" href="map.html" data-magnetic>ดูสาขา ${arrow}</a>` })}
<div class="mnav"><div class="wrap mnav__in"><div class="mchips" role="toolbar" aria-label="หมวดเมนู">${chips}</div><p class="mcount" aria-live="polite"><b data-mcount>${total}</b>เมนู</p></div></div>
${anchors}
<section class="tone-cream" aria-label="รายการเมนู"><div class="wrap mgrid" data-mgrid>
    ${cards}
</div></section>
${cta({ eyebrow: 'Shogun / Delivery', title: 'Craving now?', text: 'สั่งเมนูโปรดส่งถึงบ้านผ่าน Grab หรือ LINE MAN จากสาขาที่ใกล้คุณที่สุด', btns: deliveryBtn() + `<a class="btn btn--ghost" href="map.html" data-magnetic>ค้นหาสาขา ${arrow}</a>` })}`;
  return layout('menu', { title: 'Menu — Shogun Coffee', desc: `เมนู Shogun Coffee ${total} รายการ กาแฟคั่วเอง สโลว์บาร์ และขนมอบทุกเช้า`, main });
}

/* =========================================================
   EVENTS
   ========================================================= */
function eventsPage() {
  const dates = ['2026-12-04', '2026-12-11', '2026-12-18', '2026-12-25'].map((d) => `${d}T18:00:00+07:00`).join(',');
  const feats = [
    ['01', 'Special Event Menu', 'สัมผัสรสชาติเมนูพิเศษที่สร้างสรรค์ขึ้นเฉพาะงานนี้เท่านั้น', 'special-orange'],
    ['02', 'Single Origin Cupping', 'ชิมเมล็ดซิงเกิลออริจิน 5 แหล่ง แบบคัปปิ้งตามมาตรฐานสากล', 'chemex'],
    ['03', 'Meet the Roaster', 'คุยกับคนคั่วเรื่องโปรไฟล์การคั่ว พร้อมขนมอบที่ทำเฉพาะคืนนี้', 'w-about-1'],
  ].map(([n, t, p, img]) => `<article class="ev-feat rv">${ph(img)}<span class="ev-feat__n">${n}</span><h3>${t}</h3><p>${p}</p></article>`).join('');
  const main = `
<section class="ev-hero" aria-labelledby="ev-title">
  ${vid('cappuccino')}
  <div class="wrap ev-hero__in">
    <div class="ev-hero__t">
      <span class="eyebrow rv">Shogun Coffee · Special Event</span>
      <h1 id="ev-title" class="display" data-split data-split-now>Cupping Night</h1>
      <p class="ev-hero__meta rv"><span>ทุกวันศุกร์ 4 – 25 ธันวาคม 2026</span><span>Shogun Coffee สาขาอารีย์ · <i style="font-style:normal;white-space:nowrap">18:00 – 21:00 น.</i></span></p>
    </div>
    <div class="countdown rv" data-countdown="${dates}" aria-live="off">
      <p class="countdown__label" data-cd-label>รอบถัดไป</p>
      <div class="countdown__grid"><div><b data-cd="d">00</b><span>วัน</span></div><div><b data-cd="h">00</b><span>ชม.</span></div><div><b data-cd="m">00</b><span>นาที</span></div><div><b data-cd="s">00</b><span>วินาที</span></div></div>
    </div>
  </div>
</section>
<section class="ev-intro tone-cream" aria-labelledby="ev-intro-title">
  <div class="wrap ev-intro__grid">
    <div class="ev-intro__t"><span class="eyebrow rv">Shogun / About the night</span><h2 id="ev-intro-title" class="display h-md" data-split>5 origins,<br>one table</h2><p class="th-sub rv">คืนชิมกาแฟ 5 แหล่งปลูก บนโต๊ะเดียว คอกาแฟห้ามพลาด</p><p class="lead rv">SHOGUN Coffee House ชวนทุกคนมานั่งชิมกาแฟด้วยกันในงาน “SHOGUN CUPPING NIGHT” บาริสต้าและคนคั่วของร้านจะพาชิมเมล็ดจากไทย เอธิโอเปีย โคลอมเบีย เคนยา และกัวเตมาลา เทียบกันทีละถ้วย</p><a class="btn btn--dark rv" href="https://line.me/R/ti/p/@shogun.coffee" target="_blank" rel="noopener noreferrer" data-magnetic>จองที่นั่งทาง LINE ${arrow}</a></div>
    <figure class="ev-poster rv-scale" data-tilt>${ph('w-event-poster-src', 'ถ้วยคัปปิ้งกาแฟเรียงบนโต๊ะไม้')}<figcaption class="ev-poster__t"><img src="img/logo-white.svg" alt="Shogun Coffee" width="323" height="80"><span class="eyebrow eyebrow--plain">Special event · Pop-up</span><b class="display">Cupping<br>Night</b><span class="ev-poster__rule"></span><span>ทุกวันศุกร์ 4 – 25 ธันวาคม 2026</span><span>Shogun Coffee สาขาอารีย์ · <i style="font-style:normal;white-space:nowrap">18:00 – 21:00 น.</i></span><small>5 origins · Special menu · Meet the roaster</small></figcaption></figure>
  </div>
</section>
<section class="ev-feats tone-cream" aria-label="ไฮไลต์ของงาน"><div class="wrap ev-feats__grid">${feats}</div></section>
<section class="ev-info tone-dark" aria-labelledby="ev-info-title">
  <div class="wrap">${shead('Shogun / Event Info', 'Event info', { id: 'ev-info-title' })}
    <div class="ev-info__grid">
      <div class="ev-info__item rv"><span>วันที่</span><b>ทุกวันศุกร์ 4 – 25 ธันวาคม 2026</b></div>
      <div class="ev-info__item rv"><span>สถานที่</span><b>Shogun Coffee Ari<br>ซอยอารีย์ 4 พญาไท</b><a class="link-line" href="https://www.google.com/maps/search/?api=1&amp;query=13.7797,100.5446" target="_blank" rel="noopener noreferrer">เปิดใน Google Maps ${arrow}</a></div>
      <div class="ev-info__item rv"><span>เวลา</span><b>18:00 – 21:00 น.</b></div>
    </div>
  </div>
</section>
${cta({ tone: 'tone-latte', eyebrow: 'Shogun / Workshop', title: 'Learn to brew', text: 'นอกจาก Cupping Night เรายังมีคลาสลาเต้อาร์ตและโฮมบรูว์ทุกเสาร์–อาทิตย์ ติดต่อจองรอบได้ทาง LINE', btns: `<a class="btn btn--dark" href="https://line.me/R/ti/p/@shogun.coffee" target="_blank" rel="noopener noreferrer" data-magnetic>LINE @shogun.coffee ${arrow}</a><a class="btn btn--ghost" href="contact.html" data-magnetic>ช่องทางติดต่อ</a>` })}`;
  return layout('events', { title: 'Events — Shogun Coffee', desc: 'Shogun Cupping Night ทุกวันศุกร์ 4 – 25 ธันวาคม 2026 ที่ Shogun Coffee สาขาอารีย์ 18:00 – 21:00 น.', main });
}

/* =========================================================
   MAP
   ========================================================= */
function mapPage() {
  const main = `
${phero({ eyebrow: 'Shogun / Store Locator', title: 'Find us', th: `สาขาของเรา ${stores.length} สาขา`, lead: 'ค้นหาสาขาที่ใกล้คุณ ดูเส้นทาง หรือสั่งเดลิเวอรีจากสาขาที่เลือกได้ทันที เปิดทุกวัน 08:00 – 19:00 น.', video: 'steam', sticker: `${stores.length}<br>สาขา`, ringText: 'BANGKOK · NONTHABURI · SHOGUN COFFEE · ', btns: `<a class="btn btn--dark" href="#stores" data-magnetic>ดูแผนที่ ${arrow}</a>` + deliveryBtn('btn--ghost') })}
<section class="mp tone-cream" id="stores" aria-label="แผนที่สาขา">
  <div class="wrap mp__grid">
    <div class="mp__panel rv">
      <div class="mp__search"><label class="sr-only" for="store-q">ค้นหาสาขา</label><input id="store-q" type="search" placeholder="ค้นหาชื่อสาขาหรือเขต เช่น อารีย์" autocomplete="off" data-store-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
      <p class="mp__meta" data-store-meta aria-live="polite"></p>
      <ul class="mp__list" data-store-list data-lenis-prevent></ul>
    </div>
    <div class="mp__map rv"><div id="leaflet-map" role="region" aria-label="แผนที่สาขา Shogun Coffee"></div></div>
  </div>
  <script type="application/json" data-stores>${JSON.stringify(stores)}</script>
</section>
${cta({ eyebrow: 'Shogun / Delivery', title: 'Stay in, sip well', text: 'ไม่สะดวกแวะร้าน? สั่งผ่าน Grab หรือ LINE MAN จากสาขาที่ใกล้คุณ', btns: deliveryBtn() })}`;
  return layout('map', { title: 'Maps — Shogun Coffee', desc: `สาขา Shogun Coffee ทั้ง ${stores.length} สาขาในกรุงเทพฯ และนนทบุรี พร้อมแผนที่และเส้นทาง`, main, head: '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">' });
}

/* =========================================================
   ABOUT
   ========================================================= */
function aboutPage() {
  const main = `
${phero({ eyebrow: 'About Shogun', title: 'Our Story', th: 'เรื่องราว ความหลงใหล และศิลปะแห่งกาแฟ', lead: 'SHOGUN COFFEE เริ่มต้นจากบาร์กาแฟเล็ก ๆ ในซอยอารีย์ ด้วยความชอบในกาแฟคั่วสดและขนมอบโฮมเมด ก่อนจะเติบโตเป็นโรงคั่วและคาเฟ่ที่คัดเมล็ดจากไร่ในไทย เอธิโอเปีย และโคลอมเบีย', video: 'latte-art', sticker: 'Since<br>2016', ringText: 'FROM BEAN TO CUP · SINCE 2016 · ' })}
<section class="ab-story tone-cream" aria-labelledby="story-title">
  <div class="wrap ab-story__grid">
    <div class="ab-story__lead"><span class="eyebrow rv">Shogun / Philosophy</span><h2 id="story-title" data-split="lines">จากสาขาแรก สู่การขยายสาขาในเมือง แบรนด์ยังคงยึดมั่นในความพิถีพิถัน ละเมียดละไม และการส่งมอบประสบการณ์กาแฟระดับสเปเชียลตี</h2><p class="lead rv">เราสร้างสุนทรียภาพในการจับคู่รสชาติระหว่างกาแฟและขนมหวาน คัดสรรเมล็ดคุณภาพสูง และชงทุกแก้วด้วยมาตรฐานเดียวกันทุกสาขา</p></div>
    <div class="timeline" data-timeline><span class="timeline__line" aria-hidden="true"><i></i></span>
      <article class="tl-item rv"><span>Chapter 01</span><h3>จุดเริ่มต้นที่บาร์กาแฟ</h3><p>เริ่มจากเครื่องเอสเพรสโซ "หนึ่งเครื่อง หนึ่งบาร์" และครัวขนมอบเล็ก ๆ ชงทีละแก้วต่อหน้าลูกค้า ที่ละมุนละไมในทุกคำ</p>${vid('tamping')}</article>
      <article class="tl-item rv"><span>Chapter 02</span><h3>ก้าวสู่ Specialty Coffee</h3><p>ด้วยความหลงใหลในศาสตร์ของกาแฟ จึงคัดสรรเมล็ดกาแฟเกรดพรีเมียมจากแหล่งปลูกชั้นนำทั่วโลก สู่การเป็น Specialty House เต็มรูปแบบ</p>${ph('w-about-1', 'การคั่วกาแฟที่โรงคั่วของ Shogun Coffee')}</article>
      <article class="tl-item rv"><span>Chapter 03</span><h3>สาขาแรกและการเติบโต</h3><p>จากสาขาแรกในบรรยากาศร่มรื่น สู่การขยายสาขาทั่วเมือง เพื่อให้ทุกคนเข้าถึงสุนทรียรสของกาแฟดีได้ในทุกช่วงเวลาของชีวิต</p>${ph('w-contact', 'บรรยากาศภายในร้าน Shogun Coffee')}</article>
    </div>
  </div>
</section>
<section class="ab-stats tone-latte" aria-label="Shogun ในตัวเลข"><div class="wrap ab-stats__grid">
  <div class="ab-stat rv"><b data-count="2016">2016</b><span>ปีที่เริ่มต้นบาร์แรก</span></div>
  <div class="ab-stat rv"><b data-count="${stores.length}">${stores.length}</b><span>สาขาในกรุงเทพฯ และนนทบุรี</span></div>
  <div class="ab-stat rv"><b data-count="${total}">${total}</b><span>เมนูกาแฟและขนมอบ</span></div>
  <div class="ab-stat rv"><b data-count="5">5</b><span>แหล่งปลูกที่เราคัดเอง</span></div>
</div></section>
<section class="ab-name tone-dark" aria-labelledby="name-title">
  <div class="wrap"><span class="eyebrow rv">The meaning of Shogun</span><h2 id="name-title" class="display h-md" data-split>Sho + Gun</h2>
    <div class="ab-name__big" aria-hidden="true"><div class="ab-kanji rv-scale"><b>将</b><span>SHO</span></div><div class="ab-kanji rv-scale"><b>軍</b><span>GUN</span></div></div>
    <div class="ab-name__cols"><div class="rv"><h3>SHO 将 — ผู้นำ</h3><p>ความตั้งใจเป็นผู้นำด้านกาแฟคั่วสด ที่คัดเอง คั่วเอง และคัดเมล็ดเอง ทุกล็อตชิมก่อนเสิร์ฟ</p></div><div class="rv"><h3>GUN 軍 — ทัพ</h3><p>ทีมบาริสต้าที่ชงอย่างมีวินัย ทุกช็อตชั่งน้ำหนักและจับเวลาตามสูตรของร้าน ให้รสชาติเหมือนกันทุกสาขา</p></div></div>
  </div>
</section>
<section class="ab-values tone-cream" aria-labelledby="values-title">
  <div class="wrap">${shead('Shogun / Core Values', 'Our core values', { id: 'values-title' })}
    <div class="ab-values__grid">
      <article class="ab-value rv" data-cursor="Taste">${ph('w-croissant')}<h3>Craftsmanship<br>&amp; Pairing</h3><p>ความเชื่อที่ว่ากาแฟที่ดีต้องมาพร้อมกับขนมที่ดี การรังสรรค์เมนูจึงเน้นการจับคู่รสชาติ (Pairing) ระหว่างเมล็ดแต่ละโปรไฟล์กับเบเกอรีสูตรพิเศษของทางร้าน</p></article>
      <article class="ab-value rv" data-cursor="Sip">${ph('w-about-2')}<h3>Specialty Coffee<br>for Everyone</h3><p>การทำให้กาแฟสเปเชียลตี (Specialty Grade) และเมล็ดซิงเกิลออริจิน (Single Origin) เข้าถึงง่ายสำหรับทุกคน ไม่ว่าจะเป็นสายดำ (Black) หรือสายลาเต้ (Latte)</p></article>
    </div>
  </div>
</section>
${cta({ eyebrow: 'Shogun Coffee', title: 'From bean to cup', text: 'สัมผัสสุนทรียภาพแห่งกาแฟและขนมอบโฮมเมดได้ที่หน้าร้าน หรือเลือกชมเมนูประจำฤดูกาลของเรา', btns: `<a class="btn btn--caramel" href="menu.html" data-magnetic>Explore Coffee Menu ${arrow}</a><a class="btn btn--ghost" href="map.html" data-magnetic>ดูสาขาของเรา</a>` })}`;
  return layout('about', { title: 'About — Shogun Coffee', desc: 'เรื่องราวของ Shogun Coffee จากบาร์กาแฟเล็ก ๆ ในซอยอารีย์ สู่โรงคั่วและคาเฟ่สเปเชียลตี้', main });
}

/* =========================================================
   CONTACT
   ========================================================= */
function contactPage() {
  const ico = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    line: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.5c-5 0-9 3.2-9 7.2 0 3.6 3.2 6.6 7.5 7.1.3.1.7.2.8.5.1.2 0 .6 0 .8l-.1.8c0 .2-.2.9.8.5s5.3-3.1 7.2-5.4c1.3-1.4 1.9-2.9 1.9-4.4 0-4-4-7.1-9.1-7.1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg>',
  };
  const card = (icon, t, p, val, btns) => `<article class="ct-card rv"><span class="ct-card__ico">${icon}</span><h2>${t}</h2><p>${p}</p><span class="ct-card__val">${val}</span><div class="ct-card__btns">${btns}</div></article>`;
  const main = `
${phero({ eyebrow: 'Shogun / Contact', title: 'Say hello', th: 'ช่องทางการติดต่อ SHOGUN', lead: 'เลือกวิธีการติดต่อที่คุณต้องการ ทีมของเราพร้อมตอบทุกคำถาม ตั้งแต่เมนู เซ็ตของขวัญ ไปจนถึงการจองเวิร์กช็อป', video: 'pour-over', sticker: 'ตอบไว<br>ทุกวัน', ringText: 'CALL · LINE · EMAIL · VISIT US · ' })}
<section class="ct-cards tone-cream" aria-label="ช่องทางติดต่อ"><div class="wrap ct-cards__grid">
  ${card(ico.phone, 'Call us', 'บาริสต้าของเราพร้อมให้คำแนะนำและบริการ วันจันทร์ถึงวันอาทิตย์ เวลา 08:00 – 19:00 น.', '02 123 4567', `<a class="btn btn--dark" href="tel:021234567">โทรหาเรา</a>`)}
  ${card(ico.line, 'LINE Official', 'ทีมดูแลลูกค้าพร้อมตอบข้อความ และรับการสั่งซื้อล่วงหน้าผ่าน LINE', '@shogun.coffee', `<a class="btn btn--dark" href="https://line.me/R/ti/p/@shogun.coffee" target="_blank" rel="noopener noreferrer">แชททาง LINE</a><button type="button" class="ct-copy" data-copy="@shogun.coffee">${ico.copy}คัดลอก ID</button>`)}
  ${card(ico.mail, 'Email', 'คำถามและข้อเสนอแนะของคุณจะได้รับการตอบกลับจากทีมดูแลลูกค้าโดยเร็วที่สุด', 'hello@shoguncoffee.co', `<a class="btn btn--dark" href="mailto:hello@shoguncoffee.co">เขียนอีเมล</a><button type="button" class="ct-copy" data-copy="hello@shoguncoffee.co">${ico.copy}คัดลอกอีเมล</button>`)}
</div></section>
<section class="ct-visit tone-latte" aria-labelledby="visit-title"><div class="wrap ct-visit__grid">
  <div class="img-reveal">${ph('w-contact', 'บรรยากาศภายในร้าน Shogun Coffee', { cls: 'ct-visit__media' })}</div>
  <div class="ct-visit__t"><span class="eyebrow rv">Visit our coffee house</span><h2 id="visit-title" class="display h-md" data-split>Come say hi</h2>
    <p class="lead rv">แวะมาที่หน้าร้านเพื่อรับคำแนะนำตั้งแต่การเลือกเมล็ดกาแฟ การจัดเซ็ตของขวัญ ไปจนถึงการจับคู่เมนูกับขนม เมื่อคุณมาถึง บาริสต้าจะแนะนำซีเล็คชั่นกาแฟและขนมอบที่คัดมาให้คุณได้ลอง</p>
    <div class="hours rv"><div><span>จันทร์ – ศุกร์</span><b>08:00 – 19:00</b></div><div><span>เสาร์ – อาทิตย์</span><b>08:00 – 19:00</b></div><div><span>สาขา</span><b>${stores.length} สาขา</b></div></div>
    <a class="btn btn--dark rv" href="map.html" data-magnetic>ดูสาขาของเรา ${arrow}</a>
  </div>
</div></section>`;
  return layout('contact', { title: 'Contact — Shogun Coffee', desc: 'ติดต่อ Shogun Coffee โทร 02 123 4567 LINE @shogun.coffee อีเมล hello@shoguncoffee.co', main });
}

/* ---------- write ---------- */
const pages = { 'index.html': home(), 'menu.html': menuPage(), 'events.html': eventsPage(), 'map.html': mapPage(), 'about.html': aboutPage(), 'contact.html': contactPage() };
for (const [f, html] of Object.entries(pages)) {
  if (/\$\{|undefined/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) console.warn('CHECK', f);
  fs.writeFileSync(SITE + f, recolor(html));
  console.log(f, Math.round(html.length / 1024) + 'KB');
}
console.log('menu items:', total, menu.map((s) => s.id + ':' + s.items.length).join(' '));
