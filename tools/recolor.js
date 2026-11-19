// Shogun Coffee — CI recolour: Roastery Warm / green / gold  ->  White · Black · Red
// Used by build.js on every page it writes, and run directly (node recolor.js) on the CSS + SVG files.
const RED = '#d7141a';      // main red (text/buttons on white)
const RED_D = '#a80f15';    // deep red (hover, small labels)
const RED_L = '#ff3b3f';    // bright red (accents on black)

const MAP = {
  // Roastery Warm tokens (motion.css)
  fbf6ee: '#ffffff', f5ecdf: '#f4f4f4', ead9c2: '#e9e9e9', '3b2418': '#141414', '24160e': '#0a0a0a',
  c8823c: RED, '9a5a1f': RED_D, e8ae6e: RED_L, '12221b': '#0a0a0a', c5a259: RED_L,
  '5a3f31': '#3a3a3a', '7a5c4a': '#5c5c5c', e2d2bc: '#e3e3e3', d3bc9c: '#cfcfcf', e0cbae: '#dcdcdc',
  '7a4416': RED_D,
  // original template (navbar / footer / dialogs)
  '172d23': '#111111', '06100b': '#000000', '080a09': '#050505', '284735': '#2a2a2a',
  dfc282: '#ff6b6e', dfbf75: '#ff6b6e',
  '8b724b': RED, a68241: RED, b08d4a: RED, '947641': RED_D, '8a6b35': RED_D, '8c6b3f': RED_D, '746449': RED_D,
  f6f3ec: '#fafafa', f4f0e8: '#f5f5f5',
};

const hex2 = (n) => n.toString(16).padStart(2, '0');
const toRgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const unlin = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));

function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

// one 6-digit hex (no #, lowercase) -> new '#rrggbb'
function mapHex(h) {
  if (MAP[h]) return MAP[h];
  const rgb = toRgb(h);
  if (rgb[0] === rgb[1] && rgb[1] === rgb[2]) return '#' + h;          // already neutral
  const [hue, s, l] = hsl(rgb);
  if ((hue < 15 || hue > 345) && s > 0.4) return '#' + h;               // already red
  if (hue >= 20 && hue <= 60 && s >= 0.3 && l >= 0.3 && l <= 0.85)      // gold / caramel -> red
    return l > 0.6 ? RED_L : l > 0.45 ? RED : RED_D;
  const g = hex2(unlin(lum(rgb)));                                      // green / brown / cream -> grey, same contrast
  return '#' + g + g + g;
}

function recolor(src) {
  return src
    .replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (m, h, a, off, str) =>
      /href="$/.test(str.slice(Math.max(0, off - 6), off)) ? m : mapHex(h.toLowerCase()) + (a ? a.toLowerCase() : ''))
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*([,)])/g, (m, r, g, b, end) => {
      const n = mapHex([r, g, b].map((x) => hex2(+x)).join('')).slice(1);
      const [R, G, B] = toRgb(n);
      return m.replace(/\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*[,)]/, `(${R},${G},${B}${end}`);
    });
}

module.exports = { recolor, RED, RED_D, RED_L };

if (require.main === module) {
  const fs = require('fs');
  const SITE = 'D:/SOFT Z DIGITAL/03_เทมเพลต Soft Z/Shogun Matcha/ShogunCoffee-Website/';
  const files = ['css/motion.css', 'css/site.css', 'css/shogun.css',
    'img/logo-dark.svg', 'img/logo-gold.svg', 'img/logo-white.svg', 'img/emblem-gold.svg', 'img/emblem-white.svg'];
  for (const f of files) {
    const a = fs.readFileSync(SITE + f, 'utf8'), b = recolor(a);
    fs.writeFileSync(SITE + f, b);
    console.log(f, a === b ? 'unchanged' : 'recoloured');
  }
}
