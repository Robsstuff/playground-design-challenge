/* ════════════════════════════════════════════════════════════════════════════
   PLAYGROUND DESIGN CHALLENGE — Voting + Sheets logic
   ════════════════════════════════════════════════════════════════════════════ */

const DESIGNS = [
  { id:  1, name: 'Beachy Water Park',                   slug: '1-beachy-water-park',           active: true  },
  { id:  2, name: 'Star Wars',                           slug: '2-star-wars',                   active: true  },
  { id:  3, name: 'Laser Tag Zone',                      slug: '3-laser-tag-zone',              active: true  },
  { id:  4, name: 'Star Wars Playground',                slug: '4-star-wars-playground',        active: true  },
  { id:  5, name: 'The Cosy Cafe',                       slug: '5-the-cosy-cafe',               active: true  },
  { id:  6, name: 'Out of the Universe Land',            slug: '6-out-of-the-universe-land',    active: true  },
  { id:  7, name: 'Capybara Skatepark',                  slug: '7-capybara-skatepark',          active: true  },
  { id:  8, name: 'The Secret Snake Park',               slug: '8-the-secret-snake-park',       active: true  },
  { id:  9, name: 'Milly\'s House',                      slug: '9-millys-house',                active: true  },
  { id: 10, name: 'Ronaldo Soccer!',                     slug: '10-ronaldo-soccer',             active: true  },
  { id: 11, name: 'Pet Playland',                        slug: '11-pet-playland',               active: true  },
  { id: 12, name: 'Space Ground',                        slug: '12-space-ground',               active: true  },
  { id: 13, name: 'A Dog\'s Dream Home',                 slug: '13-a-dogs-dream-home',          active: true  },
  { id: 14, name: 'Jungle Treehouse',                    slug: '14-jungle-treehouse',           active: true  },
  { id: 15, name: 'Soccer Mad',                          slug: '15-soccer-mad',                 active: true  },
  { id: 16, name: 'Space Race World',                    slug: '16-space-race-world',           active: true  },
  { id: 17, name: 'Pink',                                slug: '17-pink',                       active: true  },
  { id: 18, name: 'MotorBike',                           slug: '18-motorbike',                  active: true  },
  { id: 19, name: 'Chill Pool',                          slug: '19-chill-pool',                 active: true  },
  { id: 20, name: 'Jungle World',                        slug: '20-jungle-world',               active: true  },
  { id: 21, name: 'Ruins',                               slug: '21-ruins',                      active: true  },
  { id: 22, name: 'Pets Pets Pets',                      slug: '22-pets-pets-pets',             active: true  },
  { id: 23, name: 'Space',                               slug: '23-space',                      active: true  },
  { id: 24, name: 'Pool and Spa',                        slug: '24-pool-and-spa',               active: true  },
  { id: 25, name: 'Music Land',                          slug: '25-music-land',                 active: true  },
  { id: 26, name: 'It\'s Raining Food!',                 slug: '26-its-raining-food',           active: true  },
  { id: 27, name: 'Cosy Beach',                          slug: '27-cosy-beach',                 active: true  },
  { id: 28, name: 'Playground Design 28',              slug: '28-placeholder',              active: false },
  { id: 29, name: 'Playground Design 29',              slug: '29-placeholder',              active: false },
  { id: 30, name: 'Playground Design 30',              slug: '30-placeholder',              active: false },
  { id: 31, name: 'Playground Design 31',              slug: '31-placeholder',              active: false },
  { id: 32, name: 'Playground Design 32',              slug: '32-placeholder',              active: false },
  { id: 33, name: 'Playground Design 33',              slug: '33-placeholder',              active: false },
  { id: 34, name: 'Playground Design 34',              slug: '34-placeholder',              active: false },
  { id: 35, name: 'Playground Design 35',              slug: '35-placeholder',              active: false },
];

// ── Rate-limiting — both buttons share a 15-second cooldown ──────────────────
const COOLDOWN_MS     = 15000;
const lsLikeKey      = id => `pg_like_t_${id}`;   // timestamp of last like
const lsInvTimeKey   = id => `pg_inv_t_${id}`;    // timestamp of last invest

function getLikeCooldownMs(id) {
  const last = parseInt(localStorage.getItem(lsLikeKey(id)) || '0');
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

function getInvestCooldownMs(id) {
  const last = parseInt(localStorage.getItem(lsInvTimeKey(id)) || '0');
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

// ── Config check ─────────────────────────────────────────────────────────────
function isConfigured() {
  return typeof APPS_SCRIPT_URL !== 'undefined'
    && APPS_SCRIPT_URL
    && !APPS_SCRIPT_URL.includes('SETUP_REQUIRED');
}

// ── Sheets fetch — fetch() first, JSONP fallback ─────────────────────────────
// Apps Script (Anyone, even anonymous) supports CORS, so fetch() works and is
// far more reliable than JSONP across browsers and school networks.
function sheetsFetch(url) {
  return fetch(url, { redirect: 'follow' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .catch(() => jsonpFetch(url));   // fallback if fetch is blocked
}

function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const cbName = '_jscb_' + Math.random().toString(36).slice(2);
    const timeout = setTimeout(() => {
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('JSONP timeout'));
    }, 10000);

    window[cbName] = (data) => {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(data);
    };

    const sep = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');
    script.onerror = () => {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('JSONP error'));
    };
    script.src = url + sep + 'callback=' + cbName;
    document.head.appendChild(script);
  });
}

// ── Local storage (optimistic / offline fallback) ────────────────────────────
const LS_KEY = 'playground_votes';

function loadLocalAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}

function getLocalVotes(id) {
  const all = loadLocalAll();
  return all[id] || { likes: 0, money: 0 };
}

function setLocalVotes(id, likes, money) {
  const all = loadLocalAll();
  all[id] = { likes, money };
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
}

// ── Counter UI helpers ────────────────────────────────────────────────────────
function rollNumber(el, to) {
  if (!el) return;
  const from = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
  if (from === to) return;
  const step  = to > from ? 1 : -1;
  const steps = Math.min(Math.abs(to - from), 20);
  const inc   = Math.ceil(Math.abs(to - from) / steps);
  let   cur   = from, count = 0;
  const iv = setInterval(() => {
    cur += step * inc;
    if ((step > 0 && cur >= to) || (step < 0 && cur <= to)) {
      cur = to; clearInterval(iv);
    }
    el.textContent = cur.toLocaleString();
    if (++count > 30) { clearInterval(iv); el.textContent = to.toLocaleString(); }
  }, 30);
}

function bumpBadge(badge) {
  if (!badge) return;
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 400);
}

function pulseBtn(btn) {
  if (!btn) return;
  btn.classList.remove('btn-pulse');
  void btn.offsetWidth;
  btn.classList.add('btn-pulse');
  setTimeout(() => btn.classList.remove('btn-pulse'), 500);
}

// ── Cooldown timer UI — shared logic for both buttons ────────────────────────
function startCooldownTimer(btn, getCooldownFn) {
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('cooling');

  function tick() {
    const ms = getCooldownFn();
    if (ms <= 0) {
      btn.disabled = false;
      btn.classList.remove('cooling');
      btn.removeAttribute('data-countdown');
      return;
    }
    btn.dataset.countdown = Math.ceil(ms / 1000) + 's';
    setTimeout(tick, 250);
  }
  tick();
}

// ── Design page initialisation ────────────────────────────────────────────────
function initDesignPage(designId) {
  const likeEl  = document.getElementById('like-count');
  const moneyEl = document.getElementById('money-count');

  // Restore from localStorage (instant)
  const local = getLocalVotes(designId);
  if (likeEl)  likeEl.textContent  = local.likes.toLocaleString();
  if (moneyEl) moneyEl.textContent = '$' + local.money.toLocaleString();

  // Restore button cooldown states
  const likeBtn   = document.querySelector('.btn-like');
  const investBtn = document.querySelector('.btn-invest');
  if (getLikeCooldownMs(designId)   > 0) startCooldownTimer(likeBtn,   () => getLikeCooldownMs(designId));
  if (getInvestCooldownMs(designId) > 0) startCooldownTimer(investBtn, () => getInvestCooldownMs(designId));

  // Fetch live from Sheets if configured
  if (isConfigured()) {
    sheetsFetch(APPS_SCRIPT_URL + '?action=get&id=' + designId)
      .then(data => {
        if (data && !data.error) {
          setLocalVotes(designId, data.likes, data.money);
          if (likeEl)  rollNumber(likeEl, data.likes);
          if (moneyEl) moneyEl.textContent = '$' + data.money.toLocaleString();
        }
      })
      .catch(() => {});
  } else {
    showSetupBanner();
  }
}

// ── Vote handlers ─────────────────────────────────────────────────────────────
async function handleLike(designId) {
  if (getLikeCooldownMs(designId) > 0) return;

  const likeBtn = document.querySelector('.btn-like');
  const likeEl  = document.getElementById('like-count');
  const moneyEl = document.getElementById('money-count');

  // Record time & start cooldown immediately
  localStorage.setItem(lsLikeKey(designId), Date.now().toString());
  startCooldownTimer(likeBtn, () => getLikeCooldownMs(designId));

  // Optimistic counter update
  const local    = getLocalVotes(designId);
  const newLikes = local.likes + 1;
  setLocalVotes(designId, newLikes, local.money);
  rollNumber(likeEl, newLikes);
  bumpBadge(likeEl);
  pulseBtn(likeBtn);

  if (!isConfigured()) return;
  try {
    const data = await sheetsFetch(APPS_SCRIPT_URL + '?action=like&id=' + designId);
    if (data && !data.error) {
      setLocalVotes(designId, data.likes, data.money);
      rollNumber(likeEl, data.likes);
      if (moneyEl) moneyEl.textContent = '$' + data.money.toLocaleString();
    }
  } catch {}
}

async function handleInvest(designId) {
  if (getInvestCooldownMs(designId) > 0) return;

  const investBtn = document.querySelector('.btn-invest');
  const likeEl    = document.getElementById('like-count');
  const moneyEl   = document.getElementById('money-count');

  // Record time & start cooldown immediately
  localStorage.setItem(lsInvTimeKey(designId), Date.now().toString());
  startCooldownTimer(investBtn, () => getInvestCooldownMs(designId));

  // Optimistic counter update
  const local    = getLocalVotes(designId);
  const newMoney = local.money + 100;
  setLocalVotes(designId, local.likes, newMoney);
  if (moneyEl) {
    moneyEl.textContent = '$' + newMoney.toLocaleString();
    bumpBadge(moneyEl);
  }
  pulseBtn(investBtn);

  if (!isConfigured()) return;
  try {
    const data = await sheetsFetch(APPS_SCRIPT_URL + '?action=invest&id=' + designId);
    if (data && !data.error) {
      setLocalVotes(designId, data.likes, data.money);
      rollNumber(likeEl, data.likes);
      if (moneyEl) moneyEl.textContent = '$' + data.money.toLocaleString();
    }
  } catch {}
}

// ── Setup banner ──────────────────────────────────────────────────────────────
function showSetupBanner() {
  if (document.querySelector('.setup-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'setup-banner';
  banner.textContent = 'Votes not saving yet — see SETUP.md to connect Google Sheets';
  document.body.appendChild(banner);
  setTimeout(() => { banner.style.opacity = '0'; banner.style.transition = 'opacity 1s'; }, 6000);
  setTimeout(() => banner.remove(), 7200);
}

// ── Home / designs nav page: load card counts ─────────────────────────────────
async function initHomePage() {
  const localAll = loadLocalAll();
  updateHomeCards(localAll);
  if (!isConfigured()) return;
  try {
    const data = await sheetsFetch(APPS_SCRIPT_URL + '?action=all');
    if (Array.isArray(data)) {
      const byId = {};
      data.forEach(d => { byId[d.id] = d; });
      updateHomeCards(byId);
      data.forEach(d => setLocalVotes(d.id, d.likes, d.money));
    }
  } catch {}
}

function updateHomeCards(dataByIdOrLocal) {
  document.querySelectorAll('[data-design-id]').forEach(card => {
    const id   = parseInt(card.dataset.designId);
    const d    = dataByIdOrLocal[id];
    if (!d) return;
    const likeEl  = card.querySelector('.card-likes');
    const moneyEl = card.querySelector('.card-money');
    if (likeEl)  likeEl.textContent  = (d.likes  !== undefined ? d.likes  : 0).toLocaleString();
    if (moneyEl) moneyEl.textContent = '$' + (d.money !== undefined ? d.money : 0).toLocaleString();
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function initLeaderboard() {
  if (!isConfigured()) {
    renderLeaderboard(DESIGNS.map(d => {
      const local = getLocalVotes(d.id);
      return { id: d.id, name: d.name, likes: local.likes, money: local.money };
    }));
    return;
  }
  try {
    const data = await sheetsFetch(APPS_SCRIPT_URL + '?action=all');
    if (Array.isArray(data)) renderLeaderboard(data);
  } catch {
    const el = document.getElementById('lb-likes');
    if (el) el.innerHTML = '<div class="lb-loading">Could not load data — check your connection.</div>';
  }
  setInterval(async () => {
    try {
      const data = await sheetsFetch(APPS_SCRIPT_URL + '?action=all');
      if (Array.isArray(data)) renderLeaderboard(data);
    } catch {}
  }, 60000);
}

function renderLeaderboard(data) {
  const byLikes = [...data].sort((a, b) => b.likes - a.likes);
  const byMoney = [...data].sort((a, b) => b.money - a.money);
  const maxLikes = Math.max(1, byLikes[0]?.likes || 1);
  const maxMoney = Math.max(1, byMoney[0]?.money || 1);
  renderPanel('lb-likes', byLikes, maxLikes, 'likes', v => v.toLocaleString() + ' like' + (v !== 1 ? 's' : ''));
  renderPanel('lb-money', byMoney, maxMoney, 'money', v => '$' + v.toLocaleString());
}

function renderPanel(id, sorted, maxVal, field, fmt) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = sorted.slice(0, 15).map((d, i) => {
    const rank  = i + 1;
    const val   = d[field] || 0;
    const pct   = maxVal > 0 ? Math.max(2, Math.round((val / maxVal) * 100)) : 2;
    const rCls  = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rn';
    const icon  = rank === 1 ? '&#9733;' : rank === 2 ? '2' : rank === 3 ? '3' : rank;
    return `<div class="lb-entry">
      <div class="lb-rank ${rCls}">${icon}</div>
      <div style="min-width:0;flex:1;">
        <div class="lb-name">${escHtml(d.name)}</div>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="lb-count">${fmt(val)}</div>
    </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.10 });
  els.forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', initReveal);
