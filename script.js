/* Thalem Space — script.js */

// ── Mobile nav toggle ──
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  loadProjects();
  loadProjectDetail();
  loadChangelog();
});

// ── Fetch helpers ──
async function fetchJSON(path) {
  try {
    const res = await fetch(path + '?t=' + Date.now());
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.error('fetchJSON failed:', path, e);
    return null;
  }
}

// ── Projects listing (projects.html) ──
async function loadProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const data = await fetchJSON('data/projects.json');
  const projects = Array.isArray(data) ? data : [];

  if (!projects.length) {
    container.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
    return;
  }

  let active = 'all';

  function render() {
    const filtered = active === 'all'
      ? projects
      : projects.filter(p => Array.isArray(p.platform) && p.platform.includes(active));

    if (!filtered.length) {
      container.innerHTML = '<p class="empty-state">No projects in this category yet.</p>';
      return;
    }

    container.innerHTML = filtered.map(p => {
      const badges = (p.platform || []).map(pl =>
        `<span class="platform-badge ${pl}">${pl}</span>`
      ).join('');
      const status = p.status ? `<span class="status-badge">${p.status}</span>` : '';
      const href = p.external_url
        ? p.external_url
        : `project.html?slug=${encodeURIComponent(p.slug)}`;
      const target = p.external_url ? ' target="_blank" rel="noopener"' : '';
      const imgBlock = p.image
        ? `<img src="assets/${p.image}" alt="${p.name}" style="width:100%;border-radius:8px 8px 0 0;display:block;aspect-ratio:16/9;object-fit:cover;margin-bottom:0.75rem;">`
        : '';
      return `
        <div class="project-card">
          ${imgBlock}
          <div class="project-card-top">${badges}${status}</div>
          <h3>${p.name}</h3>
          <p>${p.tagline || ''}</p>
          <a href="${href}"${target} class="card-link">View &rarr;</a>
        </div>`;
    }).join('');
  }

  render();

  // Filter pills
  const filterRow = document.getElementById('filter-row');
  if (filterRow) {
    filterRow.addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      active = pill.dataset.filter;
      render();
    });
  }
}

// ── Project detail (project.html) ──
async function loadProjectDetail() {
  const container = document.getElementById('project-detail');
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { container.innerHTML = '<p class="muted">No project specified.</p>'; return; }

  const data = await fetchJSON('data/projects.json');
  const projects = Array.isArray(data) ? data : [];
  const p = projects.find(x => x.slug === slug);

  if (!p) { container.innerHTML = '<p class="muted">Project not found.</p>'; return; }

  // Update page title
  document.title = p.name + ' | Thalem Space';

  const badges = (p.platform || []).map(pl =>
    `<span class="platform-badge ${pl}">${pl}</span>`
  ).join('');
  const status = p.status ? `<span class="status-badge">${p.status}</span>` : '';

  const videoBlock = p.video_url
    ? `<div class="video-wrap"><iframe src="${embedUrl(p.video_url)}" allowfullscreen></iframe></div>`
    : '';

  const featuresList = listBlock(p.features);
  const forWhoList = listBlock(p.for_who);
  const notForList = listBlock(p.not_for);

  const links = [];
  if (p.external_url) links.push(`<a href="${p.external_url}" target="_blank" rel="noopener" class="primary-link">Visit Site &rarr;</a>`);
  if (p.repo_url) links.push(`<a href="${p.repo_url}" target="_blank" rel="noopener">GitHub Repo</a>`);
  if (p.release_url) links.push(`<a href="${p.release_url}" target="_blank" rel="noopener">Releases</a>`);
  if (p.video_url) links.push(`<a href="${p.video_url}" target="_blank" rel="noopener">Watch Demo</a>`);

  container.innerHTML = `
    <div class="project-detail">
      <h1>${p.name}</h1>
      <div class="meta">${badges}${status}</div>
      <p class="tagline">${p.tagline || ''}</p>
      ${videoBlock}
      ${p.description ? `<p>${p.description}</p>` : ''}
      ${featuresList ? `<h2>Features</h2>${featuresList}` : ''}
      ${forWhoList ? `<h2>Who it&rsquo;s for</h2>${forWhoList}` : ''}
      ${notForList ? `<h2>Not for</h2>${notForList}` : ''}
      ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
    </div>`;
}

function listBlock(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return '<ul>' + arr.map(i => `<li>${i}</li>`).join('') + '</ul>';
}

function embedUrl(url) {
  const m = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

// ── Changelog (changelog.html) ──
async function loadChangelog() {
  const container = document.getElementById('log-list');
  if (!container) return;

  const data = await fetchJSON('data/changelog.json');
  const logs = Array.isArray(data) ? data : [];

  if (!logs.length) {
    container.innerHTML = '<p class="empty-state">No updates yet.</p>';
    return;
  }

  let active = 'all';

  // Build project filter pills
  const filterRow = document.getElementById('filter-row');
  if (filterRow) {
    const projects = [...new Set(logs.map(e => e.project).filter(Boolean))];
    projects.forEach(proj => {
      const btn = document.createElement('button');
      btn.className = 'filter-pill';
      btn.dataset.filter = proj;
      btn.textContent = proj;
      filterRow.appendChild(btn);
    });
    filterRow.addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      active = pill.dataset.filter;
      render();
    });
  }

  const typeBadge = { release: 'badge-release', fix: 'badge-fix', improvement: 'badge-improvement', security: 'badge-security' };

  function render() {
    const filtered = active === 'all' ? logs : logs.filter(e => e.project === active);
    if (!filtered.length) { container.innerHTML = '<p class="empty-state">No updates yet.</p>'; return; }
    container.innerHTML = filtered.map(e => `
      <div class="log-entry">
        <div class="log-dot ${e.type || 'release'}"></div>
        <div class="log-body">
          <div class="log-header">
            <span class="log-title">${e.title}</span>
            <span class="log-type-badge ${typeBadge[e.type] || 'badge-release'}">${e.type || 'update'}</span>
            ${e.project ? `<span class="log-project">${e.project}</span>` : ''}
            <span class="log-date">${e.date}</span>
          </div>
          <p class="log-description">${e.description}</p>
        </div>
      </div>`).join('');
  }

  render();
}
