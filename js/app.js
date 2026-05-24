/* ════════════════════════════════════════════════════════════════════════════
   PLAYGROUND DESIGN CHALLENGE — Voting + Sheets logic
   ════════════════════════════════════════════════════════════════════════════ */

const DESIGNS = [
  { id:  1, name: 'Beach and Sand Grass Gap',  slug: '1-beach-sand-grass-gap',  active: true  },
  { id:  2, name: 'Playground Design 2',        slug: '2-placeholder',           active: false },
  { id:  3, name: 'Playground Design 3',        slug: '3-placeholder',           active: false },
  { id:  4, name: 'Playground Design 4',        slug: '4-placeholder',           active: false },
  { id:  5, name: 'Playground Design 5',        slug: '5-placeholder',           active: false },
  { id:  6, name: 'Playground Design 6',        slug: '6-placeholder',           active: false },
  { id:  7, name: 'Playground Design 7',        slug: '7-placeholder',           active: false },
  { id:  8, name: 'Playground Design 8',        slug: '8-placeholder',           active: false },
  { id:  9, name: 'Playground Design 9',        slug: '9-placeholder',           active: false },
  { id: 10, name: 'Playground Design 10',       slug: '10-placeholder',          active: false },
  { id: 11, name: 'Playground Design 11',       slug: '11-placeholder',          active: false },
  { id: 12, name: 'Playground Design 12',       slug: '12-placeholder',          active: false },
  { id: 13, name: 'Playground Design 13',       slug: '13-placeholder',          active: false },
  { id: 14, name: 'Playground Design 14',       slug: '14-placeholder',          active: false },
  { id: 15, name: 'Playground Design 15',       slug: '15-placeholder',          active: false },
  { id: 16, name: 'Playground Design 16',       slug: '16-placeholder',          active: false },
  { id: 17, name: 'Playground Design 17',       slug: '17-placeholder',          active: false },
  { id: 18, name: 'Playground Design 18',       slug: '18-placeholder',          active: false },
  { id: 19, name: 'Playground Design 19',       slug: '19-placeholder',          active: false },
  { id: 20, name: 'Playground Design 20',       slug: '20-placeholder',          active: false },
];

// ── Rate-limiting constants ───────────────────────────────────────────────────
const LIKE_COOLDOWN_MS = 15000;          // 15 seconds between likes
const lsLikeKey  = id => `pg_like_t_${id}`;   // localStorage key: last like time
const lsInvKey   = id => `pg_inv_${id}`;       // localStorage key: has invested

function getLikeCooldownMs(id) {
  const last = parseInt(localStorage.getItem(lsLikeKey(id)) || '0');
  return Math.max(0, LIKE_COOLDOWN_MS - (Date.now() - last));
}

function hasInvested(id) {
  return localStorage.getItem(lsInvKey(id)) === '1';
}

// ── Config check ─────────────────────────────────────────────────────────────
function isConfigured() {
  return typeof APPS_SCRIPT_URL !== 'undefined'
    && APPS_SCRIPT_URL
    && !APPS_SCRIPT_URL.includes('SETUP_REQUIRED');
}

// ── JSONP fetch (avoids CORS issues with Apps Script) ────────────────────────
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

// ── Rate-limit UI: Like button countdown overlay ──────────────────────────────
function startCooldownTimer(designId) {
  const btn = document.querySelector('.btn-like');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('cooling');

  function tick() {
    const ms = getLikeCooldownMs(designId);
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

// ── Rate-limit UI: Invest button lock ────────────────────────────────────────
function lockInvestButton() {
  const btn = document.querySelector('.btn-invest');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('invested');
}

// ── Design page initialisation ────────────────────────────────────────────────
function initDesignPage(designId) {
  const likeEl  = document.getElementById('like-count');
  const moneyEl = document.getElementById('money-count');

  // Restore from localStorage (instant)
  const local = getLocalVotes(designId);
  if (likeEl)  likeEl.textContent  = local.likes.toLocaleString();
  if (moneyEl) moneyEl.textContent = '$' + local.money.toLocaleString();

  // Restore button states
  if (getLikeCooldownMs(designId) > 0) startCooldownTimer(designId);
  if (hasInvested(designId))           lockInvestButton();

  // Fetch live from Sheets if configured
  if (isConfigured()) {
    jsonpFetch(APPS_SCRIPT_URL + '?action=get&id=' + designId)
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
  // Enforce 15-second cooldown
  if (getLikeCooldownMs(designId) > 0) return;

  const btn     = document.querySelector('.btn-like');
  const likeEl  = document.getElementById('like-count');
  const moneyEl = document.getElementById('money-count');

  // Record click time & start cooldown UI immediately
  localStorage.setItem(lsLikeKey(designId), Date.now().toString());
  startCooldownTimer(designId);

  // Optimistic counter update
  const local    = getLocalVotes(designId);
  const newLikes = local.likes + 1;
  setLocalVotes(designId, newLikes, local.money);
  rollNumber(likeEl, newLikes);
  bumpBadge(likeEl);
  pulseBtn(btn);

  if (!isConfigured()) return;

  try {
    const data = await jsonpFetch(APPS_SCRIPT_URL + '?action=like&id=' + designId);
    if (data && !data.error) {
      setLocalVotes(designId, data.likes, data.money);
      rollNumber(likeEl,  data.likes);
      if (moneyEl) moneyEl.textContent = '$' + data.money.toLocaleString();
    }
  } catch {}
}

async function handleInvest(designId) {
  // Enforce once-only investment
  if (hasInvested(designId)) return;

  const btn     = document.querySelector('.btn-invest');
  const likeEl  = document.getElementById('like-count');
  const moneyEl = document.getElementById('money-count');

  // Record investment & lock button immediately
  localStorage.setItem(lsInvKey(designId), '1');
  lockInvestButton();

  // Optimistic counter update
  const local    = getLocalVotes(designId);
  const newMoney = local.money + 100;
  setLocalVotes(designId, local.likes, newMoney);
  if (moneyEl) {
    moneyEl.textContent = '$' + newMoney.toLocaleString();
    bumpBadge(moneyEl);
  }
  pulseBtn(btn);

  if (!isConfigured()) return;

  try {
    const data = await jsonpFetch(APPS_SCRIPT_URL + '?action=invest&id=' + designId);
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
    const data = await jsonpFetch(APPS_SCRIPT_URL + '?action=all');
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
    const data = await jsonpFetch(APPS_SCRIPT_URL + '?action=all');
    if (Array.isArray(data)) renderLeaderboard(data);
  } catch (e) {
    const el = document.getElementById('lb-likes');
    if (el) el.innerHTML = '<div class="lb-loading">Could not load data — check your connection.</div>';
  }

  setInterval(async () => {
    try {
      const data = await jsonpFetch(APPS_SCRIPT_URL + '?action=all');
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
  // Only show top 15 — no need to embarrass those in last place
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
