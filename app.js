/* 1001 种植物 · 1001 Plants — front-end app. Self-contained; reads window.PLANT_DATA. */
'use strict';
(function () {
const DATA = (window.PLANT_DATA || []).slice();
const $ = id => document.getElementById(id);
const IMG_BASE = "https://cdn.jsdelivr.net/gh/xujiann/1001plants-img@v3/"; // v3 adds the expansion species (ids 1002+)
const imgURL = p => p ? IMG_BASE + p : '';

// ---------- i18n ----------
let LANG = localStorage.getItem('lang1001p') || 'zh';
const T = {
  zh: { sub:' 种植物', tagline:'从苔藓蕨类到万紫千红的被子植物', works:'种', fams:'科', orders:'目',
    search:'搜索名称、学名、科属、拼音…', allOrder:'全部目', allFam:'全部科', allIucn:'全部保护等级', allHabit:'全部生活型', allOrigin:'全部原产地',
    sortDefault:'默认（知名度）', sortTaxo:'分类顺序', sortName:'按名称', taxo:'按分类', fav:'♥ 收藏', illus:'🎨 博物画',
    daily:'每日一株', random:'随机', order:'目', family:'科', iucn:'保护等级', lHabit:'生活型', lOrigin:'原产地', prev:'← 上一株', next:'下一株 →',
    nores:'未找到符合条件的植物', reset:'重置筛选', footer:'精选全球 1001 种代表性植物 · 按 APG IV 分类系统',
    about:'关于本站', source:'wiki', origin:'查看维基百科词条 →', none:'—', unranked:'未评估',
    aboutIntro:'本站精选全球约 40 万种植物中的 1001 种代表性物种，按 APG IV 分类系统覆盖 392 个科、76 个目——从苔藓、蕨类、裸子植物到被子植物。每一科至少收录一种（保底覆盖），物种丰富的大科按比例配额，力求呈现植物界分类的整体面貌。',
    aboutSrc:'数据来自维基数据（Wikidata）结构化数据、维基共享资源（Wikimedia Commons）图片与维基百科简介，均为公共知识资源。点击「🎨 博物画」可切换到古典植物图谱视图——466 种配有 19 世纪铜版／石版画，来自科勒药用植物图鉴、雷杜德、柯蒂斯植物学杂志、Flora Batava 等经典图谱（均已进入公有领域）。',
    aboutCred:'照片版权归各自作者，遵循 CC 等自由许可；古典博物画属公有领域。本站为非商业科普项目。' },
  en: { sub:' Plants', tagline:'From mosses and ferns to the flowering multitudes', works:'species', fams:'families', orders:'orders',
    search:'Search name, scientific name, family, pinyin…', allOrder:'All orders', allFam:'All families', allIucn:'All IUCN status', allHabit:'All habits', allOrigin:'All regions',
    sortDefault:'Default (notability)', sortTaxo:'Taxonomic order', sortName:'By name', taxo:'By taxonomy', fav:'♥ Saved', illus:'🎨 Plates',
    daily:'Plant of the day', random:'Random', order:'Order', family:'Family', iucn:'IUCN status', lHabit:'Habit', lOrigin:'Native to', prev:'← Prev', next:'Next →',
    nores:'No plants match your filters', reset:'Reset filters', footer:'A curated gallery of 1001 representative plant species · APG IV',
    about:'About', source:'wiki', origin:'View Wikipedia article →', none:'—', unranked:'Not evaluated',
    aboutIntro:'1001 representative species selected from the ~400,000 plant species on Earth, covering 392 families and 76 orders under the APG IV system — from mosses and ferns to gymnosperms and the flowering plants. Every family gets at least one entry; species-rich families receive proportional quotas.',
    aboutSrc:'Data from Wikidata structured data, Wikimedia Commons images and Wikipedia intros — all open knowledge resources. Hit "🎨 Plates" to switch to the classic-illustration view: 466 species carry a 19th-century engraving or lithograph from Köhler\'s Medizinal-Pflanzen, Redouté, Curtis\'s Botanical Magazine, Flora Batava and other historic florilegia (all public domain).',
    aboutCred:'Photographs © their respective authors under CC and other free licenses; the historic plates are public domain. A non-commercial educational project.' },
};
const tr = () => T[LANG];
const nameOf = p => LANG === 'zh' ? (p.zh || p.en || p.sci) : (p.en || p.sci || p.zh);
const orderName = p => LANG === 'zh' ? (p.order_zh || p.order_en) : p.order_en;
const familyName = p => LANG === 'zh' ? (p.family_zh || p.family_en) : p.family_en;
const descOf = p => LANG === 'zh' ? (p.desc_zh || p.desc_en) : (p.desc_en || p.desc_zh);
const IUCN_ORDER = ['EX','EW','CR','EN','VU','NT','LC','DD'];
const IUCN_LABEL = { LC:{zh:'无危',en:'Least Concern'}, NT:{zh:'近危',en:'Near Threatened'}, VU:{zh:'易危',en:'Vulnerable'},
  EN:{zh:'濒危',en:'Endangered'}, CR:{zh:'极危',en:'Critically Endangered'}, EW:{zh:'野外灭绝',en:'Extinct in the Wild'},
  EX:{zh:'灭绝',en:'Extinct'}, DD:{zh:'数据缺乏',en:'Data Deficient'} };
// habit (生活型) display order + EN labels; region (原产地) EN labels
const HABIT_ORDER = ['乔木','灌木','草本','藤本','多肉','禾草','竹','棕榈','针叶树','蕨类','苔藓'];
const HABIT_EN = { 乔木:'Tree', 灌木:'Shrub', 草本:'Herb', 藤本:'Vine', 多肉:'Succulent', 禾草:'Grass', 竹:'Bamboo', 棕榈:'Palm', 针叶树:'Conifer', 蕨类:'Fern', 苔藓:'Moss' };
const REGION_ORDER = ['亚洲','欧洲','非洲','北美洲','南美洲','大洋洲'];
const REGION_EN = { 亚洲:'Asia', 欧洲:'Europe', 非洲:'Africa', 北美洲:'N. America', 南美洲:'S. America', 大洋洲:'Oceania' };
const habitLabel = h => h ? (LANG === 'zh' ? h : (HABIT_EN[h] || h)) : '';
const regionLabel = z => LANG === 'zh' ? z : (REGION_EN[z] || z);

// ---------- state ----------
let favs = new Set(JSON.parse(localStorage.getItem('favs1001p') || '[]'));
const saveFavs = () => localStorage.setItem('favs1001p', JSON.stringify([...favs]));
let state = { q:'', order:'', family:'', iucn:'', habit:'', origin:'', sort:'default', favOnly:false, page:1, taxoView:false };
// image mode: 'photo' = the full 1001-species field guide; 'illus' = only species that have a
// classic public-domain botanical plate, shown as art.
let imgMode = localStorage.getItem('imgmode1001p') || 'photo';
const hasIllus = p => !!p.illus_thumb;
// which image to show for p, honouring the global mode and any per-species override
const modalOverride = new Map(); // id -> 'photo' | 'illus'
function pickImg(p, forModal) {
  const want = (forModal && modalOverride.get(p.id)) || imgMode;
  if (want === 'illus' && hasIllus(p)) return { img: p.illus_img, thumb: p.illus_thumb, ar: p.illus_ar || p.ar, illus: true };
  return { img: p.img, thumb: p.thumb, ar: p.ar, illus: false };
}
const PER = 120;
let filtered = DATA.slice();
let listView = false;

// canonical taxonomic order = seq field (phylogenetic; id is a stable identity, not order)
const taxoIndex = new Map(DATA.map((p, i) => [p.id, p.seq || i]));

// ---------- filtering ----------
function applyFilters() {
  const q = state.q.trim().toLowerCase();
  filtered = DATA.filter(p => {
    if (imgMode === 'illus' && !hasIllus(p)) return false; // 博物画模式：只收录有古典图版的物种
    if (state.favOnly && !favs.has(p.id)) return false;
    if (state.order && p.order_en !== state.order) return false;
    if (state.family && p.family_en !== state.family) return false;
    if (state.iucn && p.iucn !== state.iucn) return false;
    if (state.habit && p.habit !== state.habit) return false;
    if (state.origin && !(p.origin || []).includes(state.origin)) return false;
    if (q) {
      const hay = [p.zh, p.en, p.sci, p.family_zh, p.family_en, p.order_zh, p.order_en, p.habit, (p.origin || []).join(' '), p.py].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (state.sort === 'name') filtered.sort((a, b) => nameOf(a).localeCompare(nameOf(b), LANG === 'zh' ? 'zh' : 'en'));
  else if (state.sort === 'taxo') filtered.sort((a, b) => taxoIndex.get(a.id) - taxoIndex.get(b.id));
  else filtered.sort((a, b) => (b.langs || 0) - (a.langs || 0));
}

// ---------- render gallery ----------
const io = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const img = e.target, src = img.dataset.src;
    if (src) { img.src = src; img.onload = () => img.classList.add('loaded'); img.onerror = () => { img.closest('.card-img-wrap')?.classList.remove('loading'); }; }
    obs.unobserve(img);
  }
}, { rootMargin: '400px' });

function card(p) {
  const el = document.createElement('div');
  el.className = 'art-card';
  el.dataset.id = p.id;
  const on = favs.has(p.id) ? ' on' : '';
  const iucn = p.iucn ? `<span class="iucn iucn-${p.iucn}">${p.iucn}</span> ` : '';
  const sci = (p.sci && nameOf(p) !== p.sci) ? `<div class="card-sci">${esc(p.sci)}</div>` : '';
  const habit = p.habit ? ` · ${esc(habitLabel(p.habit))}` : '';
  const pick = pickImg(p);
  // in photo mode, hint that a classic plate also exists for this species
  const illusHint = (!pick.illus && hasIllus(p)) ? `<span class="card-illus" title="${LANG === 'zh' ? '另有博物画' : 'Botanical plate available'}">🎨</span>` : '';
  el.innerHTML =
    `<button class="card-fav${on}" data-fav="${p.id}" title="收藏">${favs.has(p.id) ? '♥' : '♡'}</button>` +
    `<span class="card-num">${p.id}</span>` +
    `<div class="card-img-wrap loading" style="--ar:${pick.ar || 1.2}">` +
      `<img alt="${esc(nameOf(p))}" data-src="${imgURL(pick.thumb || pick.img)}">` +
    `</div>` +
    `<div class="card-body">` +
      `<div class="card-era">${iucn}${esc(familyName(p))}${habit}${illusHint}</div>` +
      `<div class="card-title">${esc(nameOf(p))}</div>` +
      sci +
    `</div>`;
  io.observe(el.querySelector('img'));
  return el;
}

function renderGallery() {
  applyFilters();
  const g = $('gallery');
  const start = (state.page - 1) * PER;
  const pageItems = filtered.slice(start, start + PER);
  g.innerHTML = '';
  g.classList.toggle('list-view', listView);
  if (!filtered.length) { $('no-results').style.display = 'block'; } else { $('no-results').style.display = 'none'; }
  const frag = document.createDocumentFragment();
  pageItems.forEach(p => frag.appendChild(card(p)));
  g.appendChild(frag);
  $('shown-count').textContent = filtered.length;
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination() {
  const pages = Math.ceil(filtered.length / PER);
  const pg = $('pagination');
  pg.innerHTML = '';
  if (pages <= 1) return;
  const mk = (label, page, disabled, active) => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (active ? ' active' : '');
    b.textContent = label; b.disabled = disabled;
    b.onclick = () => { state.page = page; renderGallery(); };
    return b;
  };
  pg.appendChild(mk('‹', state.page - 1, state.page === 1));
  const win = [];
  for (let i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - state.page) <= 2) win.push(i); }
  let prev = 0;
  for (const i of win) { if (i - prev > 1) { const s = document.createElement('span'); s.textContent = '…'; s.style.color = 'var(--text3)'; s.style.padding = '0 4px'; pg.appendChild(s); } pg.appendChild(mk(i, i, false, i === state.page)); prev = i; }
  pg.appendChild(mk('›', state.page + 1, state.page === pages));
}

// ---------- taxonomy view ----------
function buildTaxoIndex() {
  const orders = new Map();
  for (const p of DATA) {
    if (!orders.has(p.order_en)) orders.set(p.order_en, { zh: p.order_zh, en: p.order_en, fams: new Map() });
    const o = orders.get(p.order_en);
    if (!o.fams.has(p.family_en)) o.fams.set(p.family_en, { zh: p.family_zh, en: p.family_en, n: 0 });
    o.fams.get(p.family_en).n++;
  }
  const wrap = $('taxo-index');
  wrap.innerHTML = '';
  const ordered = [...orders.values()].sort((a, b) => taxoIndex.get(DATA.find(p => p.order_en === a.en).id) - taxoIndex.get(DATA.find(p => p.order_en === b.en).id));
  for (const o of ordered) {
    const total = [...o.fams.values()].reduce((s, f) => s + f.n, 0);
    const div = document.createElement('div');
    div.className = 'taxo-order';
    const fams = [...o.fams.values()].map(f =>
      `<button class="taxo-fam" data-fam="${esc(f.en)}">${esc(LANG === 'zh' ? f.zh : f.en)}<small>${f.n}</small></button>`).join('');
    div.innerHTML =
      `<div class="taxo-order-head"><span class="to-arrow">▸</span>` +
      `<span class="to-name">${esc(LANG === 'zh' ? o.zh : o.en)}</span>` +
      `<span class="to-en">${esc(LANG === 'zh' ? o.en : o.zh)}</span>` +
      `<span class="to-cnt">${total} ${tr().works}</span></div>` +
      `<div class="taxo-fams">${fams}</div>`;
    div.querySelector('.taxo-order-head').onclick = () => div.classList.toggle('open');
    div.querySelectorAll('.taxo-fam').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      state.family = btn.dataset.fam; state.order = ''; state.page = 1;
      toggleTaxo(false);
      syncFilterSelects();
      renderGallery();
    });
    wrap.appendChild(div);
  }
}
function toggleTaxo(on) {
  state.taxoView = on === undefined ? !state.taxoView : on;
  $('taxo-index').classList.toggle('show', state.taxoView);
  $('gallery').style.display = state.taxoView ? 'none' : '';
  $('pagination').style.display = state.taxoView ? 'none' : '';
  $('taxo-btn').classList.toggle('active', state.taxoView);
  if (state.taxoView) buildTaxoIndex();
}

// ---------- modal ----------
let modalItem = null;
function openModal(p) {
  modalItem = p;
  const pick = pickImg(p, true);
  $('modal-img').src = imgURL(pick.img || pick.thumb);
  $('modal-img').alt = nameOf(p);
  // per-species photo ⇄ plate switch (only when both exist)
  const sw = $('modal-imgswitch');
  if (hasIllus(p) && p.img) {
    sw.style.display = '';
    sw.textContent = pick.illus ? (LANG === 'zh' ? '📷 看照片' : '📷 Photo') : (LANG === 'zh' ? '🎨 看博物画' : '🎨 Plate');
  } else sw.style.display = 'none';
  $('modal-family').textContent = familyName(p);
  $('modal-title').innerHTML = esc(nameOf(p));
  $('modal-sci').textContent = (p.sci && nameOf(p) !== p.sci) ? p.sci : '';
  $('modal-order').textContent = orderName(p) + (LANG === 'zh' && p.order_en ? ` · ${p.order_en}` : '');
  $('modal-family2').textContent = familyName(p) + (LANG === 'zh' && p.family_en ? ` · ${p.family_en}` : '');
  $('modal-habit').textContent = p.habit ? habitLabel(p.habit) : tr().none;
  $('modal-origin').textContent = (p.origin && p.origin.length) ? p.origin.map(regionLabel).join(LANG === 'zh' ? '、' : ', ') : tr().none;
  const iu = p.iucn ? `${p.iucn} · ${IUCN_LABEL[p.iucn] ? IUCN_LABEL[p.iucn][LANG] : ''}` : tr().unranked;
  $('modal-iucn').innerHTML = p.iucn ? `<span class="iucn iucn-${p.iucn}">${p.iucn}</span> ${IUCN_LABEL[p.iucn] ? IUCN_LABEL[p.iucn][LANG] : ''}` : tr().unranked;
  $('modal-desc').textContent = descOf(p) || '';
  const wiki = LANG === 'zh' ? `https://zh.wikipedia.org/wiki/${encodeURIComponent(p.zh || p.sci || '')}` : `https://en.wikipedia.org/wiki/${encodeURIComponent((p.en || p.sci || '').replace(/ /g, '_'))}`;
  // credit follows whichever image is currently shown
  const cFile = pick.illus ? p.illus_file : p.file;
  const cBy = pick.illus ? p.illus_by : p.cr_by;
  const cLic = pick.illus ? p.illus_lic : p.cr_lic;
  const cLicUrl = pick.illus ? p.illus_licurl : p.cr_licurl;
  const commons = cFile ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(cFile)}` : null;
  if (commons) {
    const label = pick.illus ? (LANG === 'zh' ? '博物画' : 'Plate') : (LANG === 'zh' ? '图片' : 'Image');
    const byLabel = pick.illus ? (LANG === 'zh' ? '绘者/来源' : 'Artist/source') : (LANG === 'zh' ? '摄影/作者' : 'By');
    const by = cBy ? `${byLabel}: ${esc(cBy)} · ` : '';
    const lic = cLic ? (cLicUrl ? `<a href="${esc(cLicUrl)}" target="_blank" rel="noopener">${esc(cLic)}</a>` : esc(cLic)) : '';
    $('modal-credit').innerHTML = `<span class="mc-label">${label}:</span> ${by}<a href="${commons}" target="_blank" rel="noopener">Wikimedia Commons</a>${lic ? ' · ' + lic : ''} · <a href="${wiki}" target="_blank" rel="noopener">${tr().origin}</a>`;
  } else {
    $('modal-credit').innerHTML = `<a href="${wiki}" target="_blank" rel="noopener">${tr().origin}</a>`;
  }
  const idx = filtered.indexOf(p);
  $('modal-num').textContent = `${idx >= 0 ? idx + 1 : '?'} / ${filtered.length}`;
  updateModalFav();
  $('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function updateModalFav() {
  const on = modalItem && favs.has(modalItem.id);
  const b = $('modal-fav');
  b.classList.toggle('on', on);
  b.textContent = on ? (LANG === 'zh' ? '♥ 已收藏' : '♥ Saved') : (LANG === 'zh' ? '♡ 收藏' : '♡ Save');
}
function closeModal() { $('modal').classList.remove('open'); document.body.style.overflow = ''; }
function navModal(dir) {
  const idx = filtered.indexOf(modalItem);
  if (idx < 0) return;
  const next = filtered[(idx + dir + filtered.length) % filtered.length];
  if (next) openModal(next);
}

// ---------- lightbox (zoom/pan) ----------
let lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };
function openLightbox(p) {
  const img = $('lb-img');
  const pick = pickImg(p, true);
  $('lb-spinner').classList.add('show');
  img.src = imgURL(pick.img || pick.thumb);
  img.onload = () => $('lb-spinner').classList.remove('show');
  $('lb-caption').textContent = nameOf(p) + (p.sci ? ` · ${p.sci}` : '') + (pick.illus ? (LANG === 'zh' ? ' · 博物画' : ' · plate') : '');
  const lf = pick.illus ? p.illus_file : p.file;
  $('lb-original').href = lf ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(lf)}` : '#';
  lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };
  applyLb();
  $('lightbox').classList.add('open');
  setTimeout(() => $('lb-hint').classList.add('fade'), 2500);
}
function applyLb() {
  const img = $('lb-img');
  img.style.transform = `translate(${lb.x}px,${lb.y}px) scale(${lb.scale})`;
  $('lb-stage').classList.toggle('zoomed', lb.scale > 1);
}
function zoomLb(f) { lb.scale = Math.max(1, Math.min(6, lb.scale * f)); if (lb.scale === 1) { lb.x = 0; lb.y = 0; } applyLb(); }
function closeLightbox() { $('lightbox').classList.remove('open'); }

// ---------- helpers ----------
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function toggleFav(id) {
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  saveFavs();
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => { const on = favs.has(id); b.classList.toggle('on', on); b.textContent = on ? '♥' : '♡'; });
  if (modalItem && modalItem.id === id) updateModalFav();
  if (state.favOnly) renderGallery();
}
function syncFilterSelects() {
  $('order-filter').value = state.order; $('family-filter').value = state.family; $('iucn-filter').value = state.iucn;
  $('habit-filter').value = state.habit; $('origin-filter').value = state.origin;
}

// ---------- populate filters ----------
function fillFilters() {
  const orders = [...new Map(DATA.map(p => [p.order_en, p])).values()].sort((a, b) => taxoIndex.get(a.id) - taxoIndex.get(b.id));
  const of = $('order-filter');
  orders.forEach(p => { const o = document.createElement('option'); o.value = p.order_en; o.textContent = LANG === 'zh' ? `${p.order_zh} ${p.order_en}` : p.order_en; of.appendChild(o); });
  const fams = [...new Map(DATA.map(p => [p.family_en, p])).values()].sort((a, b) => taxoIndex.get(a.id) - taxoIndex.get(b.id));
  const ff = $('family-filter');
  fams.forEach(p => { const o = document.createElement('option'); o.value = p.family_en; o.textContent = LANG === 'zh' ? `${p.family_zh} ${p.family_en}` : p.family_en; ff.appendChild(o); });
  const iu = $('iucn-filter');
  IUCN_ORDER.filter(c => DATA.some(p => p.iucn === c)).forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = `${c} · ${IUCN_LABEL[c][LANG]}`; iu.appendChild(o); });
  const hf = $('habit-filter');
  HABIT_ORDER.filter(h => DATA.some(p => p.habit === h)).forEach(h => { const o = document.createElement('option'); o.value = h; o.textContent = LANG === 'zh' ? h : HABIT_EN[h]; hf.appendChild(o); });
  const rf = $('origin-filter');
  REGION_ORDER.filter(z => DATA.some(p => (p.origin || []).includes(z))).forEach(z => { const o = document.createElement('option'); o.value = z; o.textContent = LANG === 'zh' ? z : REGION_EN[z]; rf.appendChild(o); });
}

// ---------- language ----------
function applyLang() {
  const t = tr();
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  $('lang-toggle').textContent = LANG === 'zh' ? 'EN' : '中';
  $('t-sub').textContent = t.sub;
  $('t-subtitle').textContent = t.tagline;
  $('t-works').textContent = t.works; $('t-fams').textContent = t.fams; $('t-orders').textContent = t.orders;
  $('search').placeholder = t.search;
  $('order-filter').options[0].textContent = t.allOrder;
  $('family-filter').options[0].textContent = t.allFam;
  $('iucn-filter').options[0].textContent = t.allIucn;
  $('habit-filter').options[0].textContent = t.allHabit;
  $('origin-filter').options[0].textContent = t.allOrigin;
  [...$('habit-filter').options].slice(1).forEach(o => o.textContent = LANG === 'zh' ? o.value : (HABIT_EN[o.value] || o.value));
  [...$('origin-filter').options].slice(1).forEach(o => o.textContent = LANG === 'zh' ? o.value : (REGION_EN[o.value] || o.value));
  const sf = $('sort-filter'); sf.options[0].textContent = t.sortDefault; sf.options[1].textContent = t.sortTaxo; sf.options[2].textContent = t.sortName;
  $('taxo-btn').textContent = t.taxo; $('fav-only-btn').textContent = t.fav; $('daily-btn').textContent = t.daily; $('random-btn').textContent = t.random;
  $('illus-btn').textContent = t.illus;
  $('l-order').textContent = t.order; $('l-family').textContent = t.family; $('l-iucn').textContent = t.iucn;
  $('l-habit').textContent = t.lHabit; $('l-origin').textContent = t.lOrigin;
  $('prev-art').textContent = t.prev; $('next-art').textContent = t.next;
  $('t-noresults').textContent = t.nores; $('reset-btn').textContent = t.reset;
  $('t-footer').textContent = t.footer; $('about-btn').textContent = t.about; $('about-title').textContent = t.about;
  $('about-intro').textContent = t.aboutIntro; $('about-sources').textContent = t.aboutSrc; $('about-credits').textContent = t.aboutCred;
  $('about-stats').innerHTML = `<span><strong>${DATA.length}</strong>${t.works}</span><span><strong>${new Set(DATA.map(p => p.family_en)).size}</strong>${t.fams}</span><span><strong>${new Set(DATA.map(p => p.order_en)).size}</strong>${t.orders}</span>`;
}

// ---------- events ----------
function bind() {
  $('lang-toggle').onclick = () => { LANG = LANG === 'zh' ? 'en' : 'zh'; localStorage.setItem('lang1001p', LANG); applyLang(); if (state.taxoView) buildTaxoIndex(); renderGallery(); };
  let dq;
  $('search').oninput = e => { clearTimeout(dq); dq = setTimeout(() => { state.q = e.target.value; state.page = 1; renderGallery(); }, 180); };
  $('clear-search').onclick = () => { $('search').value = ''; state.q = ''; state.page = 1; renderGallery(); };
  $('order-filter').onchange = e => { state.order = e.target.value; state.page = 1; renderGallery(); };
  $('family-filter').onchange = e => { state.family = e.target.value; state.page = 1; renderGallery(); };
  $('iucn-filter').onchange = e => { state.iucn = e.target.value; state.page = 1; renderGallery(); };
  $('habit-filter').onchange = e => { state.habit = e.target.value; state.page = 1; renderGallery(); };
  $('origin-filter').onchange = e => { state.origin = e.target.value; state.page = 1; renderGallery(); };
  $('sort-filter').onchange = e => { state.sort = e.target.value; state.page = 1; renderGallery(); };
  $('taxo-btn').onclick = () => toggleTaxo();
  $('illus-btn').onclick = () => {
    imgMode = imgMode === 'illus' ? 'photo' : 'illus';
    localStorage.setItem('imgmode1001p', imgMode);
    modalOverride.clear();
    $('illus-btn').classList.toggle('active', imgMode === 'illus');
    state.page = 1;
    renderGallery();
  };
  $('modal-imgswitch').onclick = e => {
    e.stopPropagation();
    if (!modalItem) return;
    const cur = pickImg(modalItem, true).illus ? 'photo' : 'illus';
    modalOverride.set(modalItem.id, cur);
    openModal(modalItem);
  };
  $('fav-only-btn').onclick = () => { state.favOnly = !state.favOnly; $('fav-only-btn').classList.toggle('active', state.favOnly); state.page = 1; renderGallery(); };
  $('random-btn').onclick = () => { const p = filtered[Math.floor(Math.random() * filtered.length)] || DATA[Math.floor(Math.random() * DATA.length)]; if (p) openModal(p); };
  $('daily-btn').onclick = () => { const day = Math.floor(Date.now() / 864e5); openModal(DATA[day % DATA.length]); };
  $('view-toggle').onclick = () => { listView = !listView; $('view-toggle').textContent = listView ? '☰' : '⊞'; renderGallery(); };
  $('reset-btn').onclick = () => { state = { q:'', order:'', family:'', iucn:'', habit:'', origin:'', sort:'default', favOnly:false, page:1, taxoView:false }; $('search').value = ''; syncFilterSelects(); $('sort-filter').value = 'default'; $('fav-only-btn').classList.remove('active'); renderGallery(); };
  // gallery delegation
  $('gallery').onclick = e => {
    const fav = e.target.closest('[data-fav]');
    if (fav) { toggleFav(+fav.dataset.fav); return; }
    const c = e.target.closest('.art-card');
    if (c) openModal(DATA.find(p => p.id === +c.dataset.id));
  };
  // modal
  $('modal-close').onclick = closeModal;
  $('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };
  $('prev-art').onclick = () => navModal(-1);
  $('next-art').onclick = () => navModal(1);
  $('modal-fav').onclick = () => modalItem && toggleFav(modalItem.id);
  $('modal-share').onclick = () => { navigator.clipboard?.writeText(location.origin + location.pathname + '?p=' + modalItem.id); const b = $('modal-share'); b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1200); };
  $('modal-img-wrap').onclick = e => { if (e.target.id === 'zoom-badge' || e.target.id === 'modal-img' || e.target.id === 'modal-img-wrap') openLightbox(modalItem); };
  // lightbox
  $('lb-close').onclick = closeLightbox;
  $('lb-zoomin').onclick = () => zoomLb(1.4);
  $('lb-zoomout').onclick = () => zoomLb(1 / 1.4);
  $('lb-reset').onclick = () => { lb.scale = 1; lb.x = 0; lb.y = 0; applyLb(); };
  const stage = $('lb-stage');
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomLb(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  stage.addEventListener('dblclick', () => zoomLb(lb.scale > 1 ? 0.01 : 2));
  stage.addEventListener('mousedown', e => { if (lb.scale <= 1) return; lb.dragging = true; lb.sx = e.clientX - lb.x; lb.sy = e.clientY - lb.y; stage.classList.add('grabbing'); });
  window.addEventListener('mousemove', e => { if (!lb.dragging) return; lb.x = e.clientX - lb.sx; lb.y = e.clientY - lb.sy; applyLb(); });
  window.addEventListener('mouseup', () => { lb.dragging = false; stage.classList.remove('grabbing'); });
  // help/about
  $('help-btn').onclick = () => $('help-overlay').classList.add('open');
  $('help-close').onclick = () => $('help-overlay').classList.remove('open');
  $('about-btn').onclick = () => $('about-overlay').classList.add('open');
  $('about-close').onclick = () => $('about-overlay').classList.remove('open');
  [$('help-overlay'), $('about-overlay')].forEach(o => o.onclick = e => { if (e.target === o) o.classList.remove('open'); });
  // to-top
  const tt = $('to-top');
  window.addEventListener('scroll', () => tt.classList.toggle('show', window.scrollY > 600));
  tt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  // keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') e.target.blur(); return; }
    if ($('lightbox').classList.contains('open')) { if (e.key === 'Escape') closeLightbox(); return; }
    if ($('modal').classList.contains('open')) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') navModal(-1);
      else if (e.key === 'ArrowRight') navModal(1);
      return;
    }
    if (e.key === '/') { e.preventDefault(); $('search').focus(); }
    else if (e.key.toLowerCase() === 'r') $('random-btn').click();
    else if (e.key.toLowerCase() === 'c') toggleTaxo();
    else if (e.key.toLowerCase() === 'f') $('fav-only-btn').click();
    else if (e.key === '?') $('help-overlay').classList.toggle('open');
    else if (e.key === 'Escape') $('help-overlay').classList.remove('open');
  });
}

// ---------- init ----------
$('fam-count').textContent = new Set(DATA.map(p => p.family_en)).size;
$('order-count').textContent = new Set(DATA.map(p => p.order_en)).size;
if (!DATA.some(hasIllus)) { imgMode = 'photo'; $('illus-btn').style.display = 'none'; } // no plates in data yet
$('illus-btn').classList.toggle('active', imgMode === 'illus');
fillFilters();
applyLang();
bind();
renderGallery();
// deep link ?p=id
const pid = +new URLSearchParams(location.search).get('p');
if (pid) { const p = DATA.find(x => x.id === pid); if (p) openModal(p); }
})();
