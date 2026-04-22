// ── SORT ──
let sortMode = 'rank';

function parseYear(y) {
  const s = String(y);
  const range = s.match(/(\d{4})[–\-](\d{2,4})/);
  if (range) {
    const end = range[2].length === 4 ? range[2] : range[1].slice(0, 2) + range[2];
    return parseInt(end);
  }
  const m = s.match(/\d{4}/);
  return m ? parseInt(m[0]) : 0;
}

function getSorted(arr) {
  return [...arr].sort((a, b) =>
    sortMode === 'rank'
      ? (b.rank ?? 0) - (a.rank ?? 0)
      : parseYear(b.year) - parseYear(a.year)
  );
}

// ── BUILD DOM FROM DATA ──
function buildProject(p, pos) {
  const ytIframe = p.youtube
    ? `<iframe class="yt-iframe" data-ytid="${p.youtube}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe><div class="yt-cover"></div>`
    : '';

  const thumbHTML = p.thumb
    ? `<img src="${p.thumb}" alt="${p.title}">`
    : `<div class="thumb-placeholder">${p.id.slice(0,2).toUpperCase()}</div>`;

  const linksHTML = p.links.length
    ? `<div class="details-links">${p.links.map(l => `<a href="${l.url}" target="_blank">${l.label}</a>`).join('')}</div>`
    : '';

  const tagsHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
  const videoCaptionHTML = (p.youtube && p.videoCaption)
    ? `<div class="video-caption">${p.videoCaption}</div>`
    : '';

  return `
    <div class="project${p.highlight ? ' highlight' : ''}" data-id="${p.id}">
      <div class="year"><span class="rank-pos">${pos}</span><span class="year-val">${p.year}</span></div>
      <div class="thumb-col">
        <div class="thumb">${ytIframe}${thumbHTML}</div>
        ${videoCaptionHTML}
      </div>
      <div class="main">
        <div class="title">${p.title}</div>
        <div class="meta"><span class="year-active">${p.year} · </span>${p.meta}</div>
        <div class="blurb">${p.blurb}</div>
        <div class="details"><div class="details-inner">
          <p>${p.involvement}</p>
          ${linksHTML}
          <div class="tags">${tagsHTML}</div>
        </div></div>
      </div>
    </div>`;
}

function buildList(tab, projects) {
  const el = document.getElementById('list-' + tab);
  el.innerHTML = projects.map((p, i) => buildProject(p, i + 1)).join('');
}

buildList('prof', getSorted(PROJECTS.professional));
buildList('pers', getSorted(PROJECTS.personal));

// ── STATE ──
let activeTab = 'prof';
const currentIdx = { prof: 0, pers: 0 };
let selectTimer = null;

// ── ELEMENTS ──
const listArea        = document.getElementById('listArea');
const scrollHint      = document.getElementById('scrollHint');
const listScrollbar   = document.getElementById('listScrollbar');
const listScrollThumb = document.getElementById('listScrollbarThumb');

function getList(tab)     { return document.getElementById('list-' + tab); }
function getProjects(tab) { return Array.from(getList(tab).querySelectorAll('.project')); }

// ── POSITION ──
function getOffset(projects, idx) {
  const areaH = listArea.getBoundingClientRect().height;
  let offset = 0;
  for (let i = 0; i < idx; i++) {
    offset += projects[i].getBoundingClientRect().height + 1; // +1 for margin-bottom
  }
  const activeH = projects[idx].getBoundingClientRect().height;
  return offset - (areaH / 2) + (activeH / 2);
}

function updateScrollbar(tab, idx) {
  const total = getProjects(tab).length;
  if (total <= 1) { listScrollbar.style.opacity = '0'; return; }
  listScrollbar.style.opacity = '1';
  const trackH = listArea.getBoundingClientRect().height - 20; // account for top/bottom offset
  const thumbH = Math.max(24, trackH / total);
  const thumbTop = idx * (trackH - thumbH) / (total - 1);
  listScrollThumb.style.height = thumbH + 'px';
  listScrollThumb.style.top    = thumbTop + 'px';
}

function applySelect(tab, idx) {
  const projects = getProjects(tab);
  projects.forEach((p, i) => p.classList.toggle('active', i === idx));
  listArea.classList.toggle('at-top',    idx === 0);
  listArea.classList.toggle('at-bottom', idx === projects.length - 1);
  if (idx !== 0) scrollHint.classList.add('hidden');
  updateScrollbar(tab, idx);
}

function activate(tab, idx) {
  const projects = getProjects(tab);
  idx = Math.max(0, Math.min(idx, projects.length - 1));
  if (idx === currentIdx[tab]) return;
  const prev = currentIdx[tab];
  currentIdx[tab] = idx;

  projects[prev].classList.remove('active');
  stopVideo(projects[prev]);
  startVideo(projects[idx]);
  applySelect(tab, idx);
  getList(tab).style.transform = `translateY(${-Math.max(0, getOffset(projects, idx))}px)`;
}

// ── VIDEO ──
function startVideo(project) {
  const iframe = project.querySelector('.yt-iframe');
  if (!iframe) return;
  project.classList.add('has-video');
  const thumb = project.querySelector('.thumb');
  const cover = project.querySelector('.yt-cover');
  thumb.classList.add('yt-playing');
  if (cover) cover.classList.add('active');
  iframe.src = `https://www.youtube.com/embed/${iframe.dataset.ytid}?autoplay=1&mute=1&controls=1`;
  project._fadeTimer = setTimeout(() => {
    thumb.classList.add('yt-fading');
    project._coverTimer = setTimeout(() => { if (cover) cover.classList.remove('active'); }, 500);
  }, 800);
}
function stopVideo(project) {
  const iframe = project.querySelector('.yt-iframe');
  if (!iframe) return;
  clearTimeout(project._fadeTimer);
  clearTimeout(project._coverTimer);
  project.classList.remove('has-video');
  const thumb = project.querySelector('.thumb');
  const cover = project.querySelector('.yt-cover');
  thumb.classList.remove('yt-playing', 'yt-fading');
  if (cover) cover.classList.remove('active');
  iframe.src = '';
}

// ── SORT TOGGLE ──
function switchSort(mode) {
  if (mode === sortMode) return;
  sortMode = mode;
  stopVideo(getProjects(activeTab)[currentIdx[activeTab]]);
  currentIdx.prof = 0;
  currentIdx.pers = 0;
  buildList('prof', getSorted(PROJECTS.professional));
  buildList('pers', getSorted(PROJECTS.personal));
  document.querySelectorAll('.sort-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.sort === mode)
  );
  document.querySelector('.page').classList.toggle('sort-rank', mode === 'rank');
  document.querySelectorAll('.project-list').forEach(l => l.style.transform = 'translateY(0)');
  scrollHint.classList.remove('hidden');
  listArea.classList.add('at-top');
  listArea.classList.remove('at-bottom');
  applySelect(activeTab, 0);
}

// ── TABS ──
function switchTab(tab) {
  if (tab === activeTab) return;
  stopVideo(getProjects(activeTab)[currentIdx[activeTab]]);
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  document.querySelectorAll('.project-list').forEach(l => l.classList.add('hidden'));
  const list = getList(tab);
  list.classList.remove('hidden');
  list.style.transform = 'translateY(0)';
  scrollHint.classList.remove('hidden');
  listArea.classList.add('at-top');
  listArea.classList.remove('at-bottom');
  applySelect(tab, currentIdx[tab]);
}

// ── JUMP TO (from highlights) ──
function jumpTo(tab, id) {
  stopVideo(getProjects(activeTab)[currentIdx[activeTab]]);
  switchTab(tab);
  const projects = getProjects(tab);
  const idx = projects.findIndex(p => p.dataset.id === id);
  if (idx < 0) return;
  currentIdx[tab] = idx;
  const list = getList(tab);
  list.style.transition = 'none';
  list.style.transform = `translateY(${-Math.max(0, getOffset(projects, idx))}px)`;
  setTimeout(() => { list.style.transition = ''; }, 50);
  startVideo(projects[idx]);
  applySelect(tab, idx);
}

// ── SCROLL ──
let lastWheel = 0;
window.addEventListener('wheel', e => {
  e.preventDefault();
  const now = Date.now();
  if (now - lastWheel < 80) return;
  lastWheel = now;
  activate(activeTab, currentIdx[activeTab] + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

// ── KEYBOARD ──
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); activate(activeTab, currentIdx[activeTab] + 1); }
  if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); activate(activeTab, currentIdx[activeTab] - 1); }
});

// ── CLICK ROW ──
document.querySelectorAll('.project-list').forEach(list => {
  list.addEventListener('click', e => {
    const row = e.target.closest('.project');
    if (!row) return;
    const projects = getProjects(activeTab);
    activate(activeTab, projects.indexOf(row));
  });
});

// ── TOUCH ──
let touchStartY = 0;
window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 30) activate(activeTab, currentIdx[activeTab] + (dy > 0 ? 1 : -1));
}, { passive: true });

// ── SCROLLBAR INTERACTION ──
function scrollbarClientYToIdx(clientY) {
  const rect  = listScrollbar.getBoundingClientRect();
  const total = getProjects(activeTab).length;
  const thumbH = Math.max(24, rect.height / total);
  const ratio = Math.max(0, Math.min(1, (clientY - rect.top - thumbH / 2) / (rect.height - thumbH)));
  return Math.round(ratio * (total - 1));
}

listScrollbar.addEventListener('mousedown', e => {
  e.preventDefault();
  listScrollbar.classList.add('dragging');
  const idx = scrollbarClientYToIdx(e.clientY);
  activate(activeTab, idx);

  function onMove(e) {
    activate(activeTab, scrollbarClientYToIdx(e.clientY));
  }
  function onUp() {
    listScrollbar.classList.remove('dragging');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// ── INIT ──
document.querySelector('.page').classList.add('sort-rank');
applySelect('prof', 0);
applySelect('pers', 0);
requestAnimationFrame(() => updateScrollbar(activeTab, currentIdx[activeTab]));
